import { Worker } from "bullmq";
import IORedis from "ioredis";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../lib/prisma";
import { s3Client } from "../lib/storage";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const bucket = process.env.AWS_BUCKET ?? "streamverse";

type JobData = { mediaId: string; userId: string; sourceKey: string; outputPrefix: string };
const variants = [
  { name: "360p", height: 360, bitrate: 800, maxrate: 960, bufsize: 1600 },
  { name: "480p", height: 480, bitrate: 1400, maxrate: 1680, bufsize: 2800 },
  { name: "720p", height: 720, bitrate: 2800, maxrate: 3360, bufsize: 5600 },
  { name: "1080p", height: 1080, bitrate: 5000, maxrate: 6000, bufsize: 10000 },
];

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

async function downloadSource(key: string, target: string) {
  const result = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error("Object storage returned an empty source file.");
  await pipeline(result.Body as NodeJS.ReadableStream, createWriteStream(target));
}

async function uploadTree(root: string, prefix: string) {
  async function visit(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(filePath);
      } else {
        const key = `${prefix}/${path.relative(root, filePath).split(path.sep).join("/")}`;
        const contentType = entry.name.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : "video/mp2t";
        await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: await readFile(filePath),
          ContentType: contentType,
          CacheControl: "private, no-store",
        }));
      }
    }
  }
  await visit(root);
}

const worker = new Worker<JobData>("video-transcoding", async (job) => {
  const { mediaId, sourceKey, outputPrefix } = job.data;
  const workDir = await mkdtemp(path.join(os.tmpdir(), "quatube-transcode-"));
  const input = path.join(workDir, "source.mp4");
  const output = path.join(workDir, "hls");
  await mkdir(output, { recursive: true });
  const asset = await prisma.mediaAsset.findFirst({
    where: { mediaId, kind: "hls", variant: "master" },
    select: { id: true },
  });

  try {
    if (!asset) throw new Error("Media asset record is missing.");
    await job.updateProgress(5);
    await downloadSource(sourceKey, input);
    const sourceStat = await stat(input);
    if (sourceStat.size === 0) throw new Error("Uploaded source is empty.");
    await job.updateProgress(15);

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      const variantDir = path.join(output, variant.name);
      await mkdir(variantDir, { recursive: true });
      const playlist = path.join(variantDir, "index.m3u8");
      const segment = path.join(variantDir, "segment_%05d.ts");
      const filter = `scale=w=-2:h='min(${variant.height},ih)':force_original_aspect_ratio=decrease`;
      await run(process.env.FFMPEG_PATH ?? "ffmpeg", [
        "-hide_banner", "-y", "-i", input,
        "-map", "0:v:0", "-map", "0:a:0?", "-vf", filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-g", "48", "-keyint_min", "48", "-sc_threshold", "0",
        "-b:v", `${variant.bitrate}k`, "-maxrate", `${variant.maxrate}k`, "-bufsize", `${variant.bufsize}k`,
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
        "-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod",
        "-hls_flags", "independent_segments", "-hls_segment_filename", segment, playlist,
      ]);
      await job.updateProgress(15 + Math.round(((index + 1) / variants.length) * 65));
    }

    const masterLines = ["#EXTM3U", "#EXT-X-VERSION:3"];
    for (const variant of variants) {
      const playlistPath = path.join(output, variant.name, "index.m3u8");
      const playlistText = await readFile(playlistPath, "utf8");
      if (!playlistText.includes("#EXTINF") || !playlistText.includes("#EXT-X-ENDLIST")) {
        throw new Error(`Generated playlist ${variant.name} is incomplete.`);
      }
      masterLines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${(variant.bitrate + 128) * 1000},RESOLUTION=${variant.height === 360 ? "640x360" : variant.height === 480 ? "854x480" : variant.height === 720 ? "1280x720" : "1920x1080"}`,
        `${variant.name}/index.m3u8`,
      );
    }
    await import("node:fs/promises").then(({ writeFile }) => writeFile(path.join(output, "master.m3u8"), `${masterLines.join("\n")}\n`));

    await uploadTree(output, outputPrefix);
    const masterKey = `${outputPrefix}/master.m3u8`;
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: "ready", masterKey, masterUrl: null, playlistUrl: null, errorMessage: null, variantUrls: variants.map((variant) => `${outputPrefix}/${variant.name}/index.m3u8`) },
    });
    await job.updateProgress(100);
    return { mediaId, status: "ready", masterKey };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Transcoding failed.";
    if (asset) await prisma.mediaAsset.update({ where: { id: asset.id }, data: { status: "failed", errorMessage: message } });
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}, { connection, concurrency: Number(process.env.TRANSCODE_CONCURRENCY ?? 1) });

worker.on("completed", (job) => console.log(`Transcode ${job.id} completed`));
worker.on("failed", (job, error) => console.error(`Transcode ${job?.id} failed`, error));
worker.on("error", (error) => console.error("Transcode worker error", error));
console.log("QuatuBe transcoding worker is running");

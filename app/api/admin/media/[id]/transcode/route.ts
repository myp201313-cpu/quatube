import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { enqueueTranscodeJob } from "@/lib/queue";
import { s3Client } from "@/lib/storage";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: access.status });

  const asset = await prisma.mediaAsset.findFirst({
    where: { mediaId: context.params.id, kind: "hls", variant: "master" },
  });
  if (!asset?.sourceKey || !asset.outputPrefix) {
    return NextResponse.json({ error: "Create an upload URL and upload the source first." }, { status: 409 });
  }

  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET ?? "streamverse", Key: asset.sourceKey }));
    const job = await enqueueTranscodeJob({
      mediaId: context.params.id,
      userId: access.userId,
      sourceKey: asset.sourceKey,
      outputPrefix: asset.outputPrefix,
    });
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { status: "processing", errorMessage: null } });
    return NextResponse.json({ jobId: job.id, status: "queued" }, { status: 202 });
  } catch (error) {
    console.error("Could not queue transcode:", error);
    return NextResponse.json({ error: "Source is missing or processing queue is unavailable." }, { status: 503 });
  }
}

import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });

export const transcodeQueue = new Queue("video-transcoding", { connection });

export type TranscodeJobData = {
  mediaId: string;
  userId: string;
  sourceKey: string;
  outputPrefix: string;
};

export async function enqueueTranscodeJob(data: TranscodeJobData) {
  return transcodeQueue.add("transcode", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

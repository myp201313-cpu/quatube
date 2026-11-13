import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_ENDPOINT ?? undefined,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "minioadmin",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "minioadmin",
  },
});

const BUCKET = process.env.AWS_BUCKET ?? "streamverse";
const PUBLIC_BASE = process.env.AWS_PUBLIC_BASE_URL ?? "http://localhost:9000/streamverse";

export async function createSignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });

  return {
    url,
    key,
    bucket: BUCKET,
    publicUrl: `${PUBLIC_BASE}/${key}`,
  };
}

export async function createSignedReadUrl(key: string, expiresIn = 60 * 60) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

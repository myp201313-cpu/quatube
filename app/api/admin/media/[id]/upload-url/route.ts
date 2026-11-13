import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { createSignedUploadUrl } from "@/lib/storage";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const inputSchema = z.object({ fileName: z.string().trim().min(1).max(180), contentType: z.literal("video/mp4") });

export async function POST(request: Request, context: { params: { id: string } }) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: access.status });

  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Only an MP4 upload is supported." }, { status: 400 });
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: { mediaId: context.params.id, kind: "hls", variant: "master" },
    select: { id: true, status: true },
  });
  if (!asset) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const sourceKey = `uploads/${context.params.id}/${randomUUID()}-${safeName}`;
  const outputPrefix = `hls/${context.params.id}`;

  try {
    const upload = await createSignedUploadUrl(sourceKey, input.contentType);
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { sourceKey, outputPrefix, status: "pending", errorMessage: null },
    });
    return NextResponse.json({ uploadUrl: upload.url, sourceKey, expiresInSeconds: 600 });
  } catch (error) {
    console.error("Could not create upload URL:", error);
    return NextResponse.json({ error: "Storage is unavailable." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const mediaId = params.id;
  const streamUrl = `https://cdn.example.com/videos/${mediaId}/master.m3u8?token=dev-token&exp=${Date.now() + 60_000}`;

  return NextResponse.json({
    streamUrl,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const media = await prisma.media.findFirst({ where: { id: context.params.id, status: "PUBLISHED", isActive: true, assets: { some: { kind: "hls", variant: "master", status: "ready", masterKey: { not: null } } } }, select: { id: true } });
  if (!media) return NextResponse.json({ error: "Media not found or unavailable." }, { status: 404 });
  // Fail closed until an edge signer/protected CDN is configured. Never expose object-store keys or raw files.
  if (!process.env.PLAYBACK_AUTH_URL) return NextResponse.json({ error: "Protected playback delivery is not configured." }, { status: 503 });
  return NextResponse.json({ error: "Configure a trusted playback signer integration for PLAYBACK_AUTH_URL." }, { status: 503 });
}

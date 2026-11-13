import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const progressSchema = z.object({
  mediaId: z.string().min(1),
  profileId: z.string().min(1),
  currentPositionMs: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  durationMs: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  completed: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const history = await prisma.watchHistory.findMany({
    where: { userId: session.user.id },
    include: { media: true },
    orderBy: { lastWatchedAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ items: history.map((entry) => ({
    id: entry.mediaId,
    title: entry.media.title,
    posterUrl: entry.media.posterUrl,
    currentPositionMs: Number(entry.currentPositionMs),
    durationMs: Number(entry.durationMs),
    completed: entry.completed,
  })) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let input: z.infer<typeof progressSchema>;
  try { input = progressSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 }); }

  const profile = await prisma.profile.findFirst({ where: { id: input.profileId, userId: session.user.id }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const media = await prisma.media.findFirst({ where: { id: input.mediaId, status: "PUBLISHED", isActive: true }, select: { id: true } });
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const history = await prisma.watchHistory.upsert({
    where: { profileId_mediaId: { profileId: profile.id, mediaId: media.id } },
    create: {
      userId: session.user.id,
      profileId: profile.id,
      mediaId: media.id,
      currentPositionMs: BigInt(input.currentPositionMs),
      durationMs: BigInt(input.durationMs),
      completed: input.completed,
    },
    update: {
      currentPositionMs: BigInt(input.currentPositionMs),
      durationMs: BigInt(input.durationMs),
      completed: input.completed,
      lastWatchedAt: new Date(),
    },
  });
  return NextResponse.json({ success: true, lastWatchedAt: history.lastWatchedAt });
}

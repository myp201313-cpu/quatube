import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId: session.user.id },
    include: { media: true },
    orderBy: { lastWatchedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    items: history.map((entry) => ({
      id: entry.mediaId,
      title: entry.media.title,
      posterUrl: entry.media.posterUrl,
      currentPositionMs: Number(entry.currentPositionMs),
      durationMs: Number(entry.durationMs),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const mediaId = String(body.mediaId ?? "");
  const profileId = String(body.profileId ?? "");
  const currentPositionMs = BigInt(body.currentPositionMs ?? 0);
  const durationMs = BigInt(body.durationMs ?? 0);
  const completed = Boolean(body.completed ?? false);

  if (!mediaId || !profileId) {
    return NextResponse.json({ error: "mediaId and profileId are required." }, { status: 400 });
  }

  const item = await prisma.watchHistory.upsert({
    where: {
      id: `${session.user.id}:${profileId}:${mediaId}`,
    },
    create: {
      id: `${session.user.id}:${profileId}:${mediaId}`,
      userId: session.user.id,
      profileId,
      mediaId,
      currentPositionMs,
      durationMs,
      completed,
      lastWatchedAt: new Date(),
    },
    update: {
      currentPositionMs,
      durationMs,
      completed,
      lastWatchedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, item });
}

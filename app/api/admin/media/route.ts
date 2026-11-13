import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

const createMediaSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  synopsis: z.string().trim().max(10000).optional(),
  releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5).optional(),
  language: z.string().trim().max(16).optional(),
  genres: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: access.status });

  const media = await prisma.media.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { assets: { select: { id: true, status: true, variant: true, updatedAt: true } } },
  });

  return NextResponse.json({ media });
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: access.status });

  let input: z.infer<typeof createMediaSchema>;
  try {
    input = createMediaSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid media metadata." }, { status: 400 });
  }

  try {
    const media = await prisma.media.create({
      data: {
        ...input,
        assets: { create: [{ kind: "hls", variant: "master", status: "pending" }] },
      },
      include: { assets: true },
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That media slug is already in use." }, { status: 409 });
    }
    console.error("Media creation failed:", error);
    return NextResponse.json({ error: "Unable to create media." }, { status: 500 });
  }
}

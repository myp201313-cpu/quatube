import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing search query." }, { status: 400 });
  }

  const results = await prisma.media.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { synopsis: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: {
      id: true,
      title: true,
      synopsis: true,
      releaseYear: true,
      posterUrl: true,
      slug: true,
    },
  });

  return NextResponse.json({ results });
}

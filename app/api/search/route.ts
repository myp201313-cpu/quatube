import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query || query.length > 100) return NextResponse.json({ error: "Provide a search query of at most 100 characters." }, { status: 400 });

  const results = await prisma.media.findMany({
    where: {
      status: "PUBLISHED",
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { synopsis: { contains: query, mode: "insensitive" } },
        { genres: { has: query } },
      ],
    },
    take: 20,
    select: { id: true, title: true, synopsis: true, releaseYear: true, posterUrl: true, slug: true, genres: true },
  });
  return NextResponse.json({ results });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Search provider is not configured for external catalog lookups." }, { status: 501 });
}

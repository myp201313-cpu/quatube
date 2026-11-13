import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !["ADMIN", "REVIEWER"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const events = await prisma.mediaReviewAction.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { media: { select: { id: true, title: true } }, actor: { select: { name: true, email: true } } } });
  return NextResponse.json({ events });
}

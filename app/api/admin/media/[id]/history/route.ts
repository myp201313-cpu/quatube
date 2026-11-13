import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !["ADMIN", "REVIEWER"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const actions = await prisma.mediaReviewAction.findMany({ where: { mediaId: context.params.id }, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true, email: true } } } });
  return NextResponse.json({ actions });
}

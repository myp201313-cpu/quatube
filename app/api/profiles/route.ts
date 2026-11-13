import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profiles = await prisma.profile.findMany({ where: { userId: session.user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], select: { id: true, name: true, avatarUrl: true, maturity: true, isPrimary: true } });
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: unknown; maturity?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const maturity = body?.maturity;
  if (!name || name.length > 40 || !["GENERAL", "TEEN", "ADULT"].includes(String(maturity ?? "GENERAL"))) return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
  const count = await prisma.profile.count({ where: { userId: session.user.id } });
  if (count >= 5) return NextResponse.json({ error: "Maximum of five profiles reached." }, { status: 409 });
  const profile = await prisma.profile.create({ data: { userId: session.user.id, name, maturity: String(maturity ?? "GENERAL") as "GENERAL" | "TEEN" | "ADULT" } });
  return NextResponse.json({ profile }, { status: 201 });
}

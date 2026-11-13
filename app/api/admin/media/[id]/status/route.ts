import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(_request: Request, context: { params: { id: string } }) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: access.status });

  const asset = await prisma.mediaAsset.findFirst({
    where: { mediaId: context.params.id, kind: "hls", variant: "master" },
    select: { status: true, errorMessage: true, updatedAt: true },
  });
  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  return NextResponse.json({ asset });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const inputSchema = z.object({
  action: z.enum(["submit", "approve", "reject", "publish", "archive"]),
  note: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!actor || actor.role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let input: z.infer<typeof inputSchema>;
  try { input = inputSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid workflow request." }, { status: 400 }); }

  if (input.action === "reject" && !input.note?.trim()) {
    return NextResponse.json({ error: "A rejection note is required." }, { status: 400 });
  }
  if (["submit", "publish", "archive"].includes(input.action) && !["ADMIN", "EDITOR"].includes(actor.role)) {
    return NextResponse.json({ error: "Editor role required." }, { status: 403 });
  }
  if (["approve", "reject"].includes(input.action) && !["ADMIN", "REVIEWER"].includes(actor.role)) {
    return NextResponse.json({ error: "Reviewer role required." }, { status: 403 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const media = await tx.media.findUnique({ where: { id: context.params.id } });
      if (!media) return { error: "Media not found.", status: 404 } as const;

      let from: typeof media.status;
      let to: typeof media.status;
      let event: string;
      const extra: { submittedAt?: Date; publishedAt?: Date; isActive?: boolean } = {};

      if (input.action === "submit") {
        if (media.status !== "DRAFT") return { error: "Only drafts can be submitted.", status: 409 } as const;
        if (!media.title.trim() || !media.synopsis?.trim() || !media.posterUrl) return { error: "Title, synopsis, and poster are required.", status: 422 } as const;
        const asset = await tx.mediaAsset.findFirst({ where: { mediaId: media.id, kind: "hls", variant: "master", status: "ready", masterKey: { not: null } } });
        if (!asset) return { error: "A transcoded, ready HLS asset is required.", status: 422 } as const;
        from = "DRAFT"; to = "IN_REVIEW"; event = "SUBMITTED"; extra.submittedAt = new Date();
      } else if (input.action === "approve" || input.action === "reject") {
        if (media.status !== "IN_REVIEW") return { error: "Only items in review can be approved or rejected.", status: 409 } as const;
        const submitter = await tx.mediaReviewAction.findFirst({ where: { mediaId: media.id, action: "SUBMITTED" }, orderBy: { createdAt: "desc" }, select: { actorId: true } });
        if (submitter?.actorId === actor.id && actor.role !== "ADMIN") return { error: "Submitters cannot review their own item.", status: 403 } as const;
        from = "IN_REVIEW"; to = input.action === "approve" ? "APPROVED" : "DRAFT"; event = input.action === "approve" ? "APPROVED" : "REJECTED";
      } else if (input.action === "publish") {
        if (media.status !== "APPROVED") return { error: "Only approved items can be published.", status: 409 } as const;
        const asset = await tx.mediaAsset.findFirst({ where: { mediaId: media.id, kind: "hls", variant: "master", status: "ready", masterKey: { not: null } } });
        if (!asset) return { error: "A ready HLS asset is required before publication.", status: 422 } as const;
        from = "APPROVED"; to = "PUBLISHED"; event = "PUBLISHED"; extra.publishedAt = new Date(); extra.isActive = true;
      } else {
        if (media.status !== "PUBLISHED") return { error: "Only published items can be archived.", status: 409 } as const;
        from = "PUBLISHED"; to = "ARCHIVED"; event = "ARCHIVED"; extra.isActive = false;
      }

      const changed = await tx.media.updateMany({ where: { id: media.id, status: from }, data: { ...extra, status: to } });
      if (changed.count !== 1) return { error: "Media changed concurrently. Reload and retry.", status: 409 } as const;
      await tx.mediaReviewAction.create({ data: { mediaId: media.id, actorId: actor.id, action: event, note: input.note ?? null } });
      return { media: await tx.media.findUnique({ where: { id: media.id }, select: { id: true, title: true, status: true, isActive: true } }) } as const;
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Editorial workflow error:", error);
    return NextResponse.json({ error: "Unable to update editorial state." }, { status: 500 });
  }
}

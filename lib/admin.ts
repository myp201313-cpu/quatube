import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false as const, status: 401 as const };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return { ok: false as const, status: 403 as const };
  }

  return { ok: true as const, userId, role: user.role };
}

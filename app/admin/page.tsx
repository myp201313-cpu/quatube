import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !["ADMIN", "EDITOR", "REVIEWER"].includes(user.role)) redirect("/dashboard");

  const media = await prisma.media.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { assets: { where: { kind: "hls", variant: "master" }, select: { status: true, errorMessage: true, updatedAt: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm uppercase tracking-widest text-red-400">QuatuBe Studio</p><h1 className="mt-2 text-4xl font-black">Catalog operations</h1></div>
          {user.role !== "REVIEWER" && <Link href="/admin/media/new" className="rounded-lg bg-red-600 px-4 py-3 font-semibold">Create title</Link>}
        </header>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-800 text-slate-300"><tr><th className="p-4">Title</th><th className="p-4">Editorial</th><th className="p-4">Asset</th><th className="p-4">Updated</th></tr></thead>
            <tbody>{media.map((item) => <tr key={item.id} className="border-t border-white/10"><td className="p-4 font-medium">{item.title}<div className="text-xs text-slate-500">/{item.slug}</div></td><td className="p-4">{item.status}</td><td className="p-4">{item.assets[0]?.status ?? "not uploaded"}{item.assets[0]?.errorMessage ? <div className="max-w-xs text-xs text-red-300">{item.assets[0].errorMessage}</div> : null}</td><td className="p-4 text-slate-400">{item.updatedAt.toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-500">Upload and workflow actions are protected by server-side role checks. Never expose raw source objects publicly.</p>
      </div>
    </main>
  );
}

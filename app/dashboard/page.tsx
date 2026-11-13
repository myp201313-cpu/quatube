import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [history, profiles] = await Promise.all([
    prisma.watchHistory.findMany({ where: { userId: session.user.id, completed: false }, include: { media: true }, orderBy: { lastWatchedAt: "desc" }, take: 8 }),
    prisma.profile.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, isPrimary: true } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4"><div className="text-2xl font-black tracking-wide text-red-500">QUATUBE</div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">{profiles.length} profile(s)</span><SignOutButton /></div></header>
        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.28em] text-red-400">Welcome back</p><h1 className="mt-2 text-3xl font-bold">{session.user.name ?? session.user.email}</h1></section>
        <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Continue Watching</h2>{history.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{history.map((entry) => { const progress = Number(entry.durationMs) > 0 ? Math.min(100, Number(entry.currentPositionMs) / Number(entry.durationMs) * 100) : 0; return <a key={entry.id} href={`/watch/${entry.mediaId}`} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900"><div className="relative"><img src={entry.media.posterUrl ?? ""} alt="" className="h-48 w-full object-cover"/><div className="absolute inset-x-0 bottom-0 h-1 bg-slate-700"><div className="h-full bg-red-500" style={{ width: `${progress}%` }}/></div></div><div className="p-3"><p className="truncate font-semibold">{entry.media.title}</p><p className="text-xs text-slate-400">{Math.round(progress)}% watched</p></div></a>; })}</div> : <p className="text-sm text-slate-400">Your watch progress will appear here.</p>}</section>
      </div>
    </main>
  );
}

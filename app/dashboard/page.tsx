import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black tracking-wide text-red-500">QUATUBE</div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white">
              Profiles
            </button>
            <form action="/api/auth/signout" method="post">
              <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-red-400">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold">{session.user.email}</h1>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Continue Watching</h2>
            <p className="mt-2 text-sm text-slate-400">Resume your latest titles.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">My List</h2>
            <p className="mt-2 text-sm text-slate-400">Saved titles for later.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h2 className="text-xl font-semibold">Profiles</h2>
            <p className="mt-2 text-sm text-slate-400">Switch between viewers.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

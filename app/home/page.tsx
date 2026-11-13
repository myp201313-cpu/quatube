import Link from "next/link";

const trending = [
  { id: "tt101", title: "The Midnight Signal", poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80", year: "2025" },
  { id: "tt102", title: "Stormline", poster: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=800&q=80", year: "2024" },
  { id: "tt103", title: "Neon Harbor", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80", year: "2023" },
  { id: "tt104", title: "Glass Horizon", poster: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80", year: "2025" },
];

const continueWatching = [
  { id: "tt201", title: "Night Circuit", poster: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80", year: "Episode 5" },
  { id: "tt202", title: "Silent Vault", poster: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=800&q=80", year: "Episode 2" },
  { id: "tt203", title: "Final Echo", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80", year: "Episode 7" },
  { id: "tt204", title: "Road to Horizon", poster: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80", year: "Episode 3" },
];

function Row({ title, items }: { title: string; items: typeof trending }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link key={item.id} href={`/watch/${item.id}`} className="group min-w-[180px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900 transition hover:scale-[1.02]">
            <div className="relative">
              <img src={item.poster} alt={item.title} className="h-[260px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.year}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPreview() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="text-2xl font-black tracking-wide text-red-500">QUATUBE</div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white">
              Profiles
            </button>
            <Link href="/login" className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
              Sign in
            </Link>
          </div>
        </header>

        <section
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.68) 35%, rgba(2,6,23,0.2) 100%), url(https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="min-h-[420px] px-6 py-10 md:px-10 md:py-14">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-red-400">New Release</p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">The Midnight Signal</h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200 md:text-base">
                When a rogue signal reaches a forgotten network, a gifted cryptographer must stop it from rewriting the future.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/watch/tt101" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Play Now
                </Link>
                <button className="rounded-lg border border-white/20 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800/70">
                  + My List
                </button>
              </div>
            </div>
          </div>
        </section>

        <Row title="Trending Now" items={trending} />
        <Row title="Continue Watching" items={continueWatching} />
        <Row title="Sci‑Fi" items={trending} />
      </div>
    </main>
  );
}

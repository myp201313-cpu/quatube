import { VideoPlayer } from "@/components/VideoPlayer";

export default function WatchPage({ params }: { params: { id: string } }) {
  const streamUrl = `https://cdn.example.com/videos/${params.id}/master.m3u8`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-red-400">Continue Watching</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">The Midnight Signal</h1>
        </div>

        <VideoPlayer title="The Midnight Signal" poster="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80" streamUrl={streamUrl} />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              A rogue signal begins broadcasting across the world’s forgotten infrastructure.
              A gifted cryptographer tries to decode it before an AI system rewrites the future.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Sci-Fi",
                "Thriller",
                "2025",
                "HD",
                "4K",
              ].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h3 className="text-lg font-semibold">Details</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Genre: Sci-Fi / Thriller</li>
              <li>Runtime: 118 min</li>
              <li>Audio: English, Spanish</li>
              <li>Subtitles: English, Spanish, French</li>
              <li>Quality: 1080p, 720p, 480p</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}

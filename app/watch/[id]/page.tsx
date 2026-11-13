import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VideoPlayer } from "@/components/VideoPlayer";

export default async function WatchPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const media = await prisma.media.findFirst({
    where: { id: params.id, status: "PUBLISHED", isActive: true },
    include: { subtitles: { orderBy: { isDefault: "desc" } } },
  });
  if (!media) redirect("/dashboard");

  // Do not embed public/raw storage paths here. Playback must be authorized by an edge/CDN signer.
  const streamUrl = process.env.NEXT_PUBLIC_PLAYBACK_URL
    ? `${process.env.NEXT_PUBLIC_PLAYBACK_URL}/${encodeURIComponent(media.id)}/master.m3u8`
    : null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.28em] text-red-400">Now playing</p>
        <h1 className="mb-6 mt-2 text-3xl font-bold md:text-5xl">{media.title}</h1>
        {streamUrl ? <VideoPlayer title={media.title} poster={media.backdropUrl ?? media.posterUrl ?? undefined} streamUrl={streamUrl} /> : <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">Playback delivery is not configured. Configure a protected CDN playback origin before enabling streams.</div>}
        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5"><h2 className="text-xl font-semibold">Overview</h2><p className="mt-3 text-sm leading-7 text-slate-300">{media.synopsis ?? "No synopsis is available."}</p><div className="mt-5 flex flex-wrap gap-2">{media.genres.map((genre) => <span key={genre} className="rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs">{genre}</span>)}</div></section>
      </div>
    </main>
  );
}

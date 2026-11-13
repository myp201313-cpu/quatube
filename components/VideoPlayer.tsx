"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type VideoPlayerProps = {
  streamUrl: string;
  poster?: string;
  title?: string;
};

export function VideoPlayer({ streamUrl, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [quality, setQuality] = useState("Auto");
  const [isPiP, setIsPiP] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        backBufferLength: 90,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => undefined);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level && level.height) setQuality(`${level.height}p`);
      });

      return () => hls.destroy();
    }

    return undefined;
  }, [streamUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      if (event.code === "Space") {
        event.preventDefault();
        if (video.paused) void video.play(); else video.pause();
      }

      if (event.key === "ArrowRight") video.currentTime += 10;
      if (event.key === "ArrowLeft") video.currentTime -= 10;
      if (event.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else void video.requestFullscreen();
      }
      if (event.key.toLowerCase() === "m") {
        video.muted = !video.muted;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title ?? "Quatube Stream",
      artist: "Quatube",
      artwork: poster ? [{ src: poster, sizes: "512x512", type: "image/jpeg" }] : [],
    });

    navigator.mediaSession.setActionHandler("play", () => void videoRef.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => videoRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      if (videoRef.current) videoRef.current.currentTime -= 10;
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      if (videoRef.current) videoRef.current.currentTime += 10;
    });
  }, [poster, title]);

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.warn("PiP not available:", error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <video ref={videoRef} className="aspect-video w-full bg-black" controls playsInline poster={poster} />

      <div className="absolute right-4 top-4 flex items-center gap-2">
        <button
          onClick={togglePiP}
          className="rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs text-white ring-1 ring-white/10"
        >
          {isPiP ? "Exit PiP" : "PiP"}
        </button>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 outline-none"
        >
          <option value="Auto">Auto</option>
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
          <option value="480p">480p</option>
          <option value="360p">360p</option>
        </select>
      </div>
    </div>
  );
}

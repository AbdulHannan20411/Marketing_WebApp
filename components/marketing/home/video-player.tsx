"use client";

import { PlayIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/**
 * Click-to-play YouTube player. Until someone presses play, the page shows only the
 * thumbnail, served through Next.js from our own origin, so YouTube isn't contacted and
 * the page stays fast. The player uses youtube-nocookie.com and continues through the
 * playlist after the first video.
 */
export function VideoPlayer({
  videoId,
  playlistId,
  title,
  playLabel,
}: {
  videoId: string;
  playlistId: string;
  /** Accessible name of the player once it is loaded. */
  title: string;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?list=${encodeURIComponent(playlistId)}&autoplay=1&rel=0&playsinline=1`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border bg-slate-950 shadow-lift">
      {playing ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 size-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={playLabel}
          className="group absolute inset-0 size-full cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 1024px) 60rem, 100vw"
            className="object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/30 transition-colors duration-300 group-hover:bg-slate-950/15"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 m-auto flex size-18 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-xl transition-transform duration-300 ease-out-soft group-hover:scale-105 motion-reduce:transition-none sm:size-20"
          >
            <PlayIcon className="size-8 translate-x-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}

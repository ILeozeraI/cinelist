"use client";

import Image from "next/image";
import { useState } from "react";
import type { Trailer } from "@/lib/tmdb/types";

export function TrailerPlayer({ trailer, title }: { trailer: Trailer; title: string }) {
  const [playing, setPlaying] = useState(false);
  const key = encodeURIComponent(trailer.key);

  if (playing) {
    return (
      <iframe
        className="aspect-video w-full rounded-xl"
        src={`https://www.youtube-nocookie.com/embed/${key}?autoplay=1`}
        title={`Trailer de ${title}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Assistir ao trailer de ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-zinc-900"
    >
      <Image
        src={`https://i.ytimg.com/vi/${key}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 896px) 100vw, 896px"
        className="object-cover opacity-80 transition group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-2xl text-zinc-950"
      >
        ▶
      </span>
    </button>
  );
}

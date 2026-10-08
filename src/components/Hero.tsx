import Image from "next/image";
import Link from "next/link";
import { formatRating, tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/tmdb/types";
import { ProviderLogos } from "./ProviderLogos";

export function Hero({ movie }: { movie: Movie }) {
  const backdrop = tmdbImage(movie.backdropPath, "w1280");
  const meta = [movie.year, movie.rating > 0 ? `★ ${formatRating(movie.rating)}` : null].filter(Boolean).join(" · ");

  return (
    <section aria-label="Destaque" className="relative overflow-hidden rounded-2xl bg-zinc-900">
      {backdrop && <Image src={backdrop} alt="" fill loading="eager" sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />}
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="relative flex min-h-[260px] flex-col justify-end gap-3 p-6 md:min-h-[420px] md:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Em destaque</p>
        <h1 className="max-w-2xl text-3xl font-bold md:text-5xl">{movie.title}</h1>
        <p className="text-sm text-zinc-300">{meta}</p>
        <ProviderLogos providers={movie.providers} size="md" />
        <Link
          href={`/filme/${movie.id}`}
          className="w-fit rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300"
        >
          Ver detalhes
        </Link>
      </div>
    </section>
  );
}

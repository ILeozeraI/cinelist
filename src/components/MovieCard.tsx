import Image from "next/image";
import Link from "next/link";
import { formatRating, tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/tmdb/types";
import { ProviderLogos } from "./ProviderLogos";

export function MovieCard({ movie }: { movie: Movie }) {
  const poster = tmdbImage(movie.posterPath, "w342");
  const meta = [movie.year ?? "—", movie.rating > 0 ? `★ ${formatRating(movie.rating)}` : null].filter(Boolean).join(" · ");

  return (
    <Link href={`/filme/${movie.id}`} className="group block focus:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800 ring-yellow-400 transition group-hover:scale-[1.03] group-focus-visible:ring-2">
        {poster ? (
          <Image src={poster} alt={`Pôster de ${movie.title}`} fill sizes="(max-width: 768px) 45vw, 200px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-zinc-300">{movie.title}</div>
        )}
        <ProviderLogos providers={movie.providers} className="absolute bottom-1.5 left-1.5" />
      </div>
      <h3 className="mt-2 truncate text-sm font-medium">{movie.title}</h3>
      <p className="text-xs text-zinc-400">{meta}</p>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { formatRating, tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/tmdb/types";
import { StarIcon } from "./Icons";
import { ProviderLogos } from "./ProviderLogos";

/** `eager`: o pôster aparece no topo da tela e deve carregar na hora (é candidato a LCP). */
export function MovieCard({ movie, eager = false }: { movie: Movie; eager?: boolean }) {
  const poster = tmdbImage(movie.posterPath, "w342");

  return (
    <Link href={`/filme/${movie.id}`} className="group block focus:outline-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-poltrona ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-14px_rgb(0_0_0/0.9)] group-hover:ring-projetor/80 group-focus-visible:ring-2 group-focus-visible:ring-projetor">
        {poster ? (
          <Image
            src={poster}
            alt={`Pôster de ${movie.title}`}
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(max-width: 768px) 45vw, 210px"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-poltrona to-sala p-3 text-center font-display text-xl leading-tight font-bold text-tela/80">
            {movie.title}
          </div>
        )}
        {movie.providers.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent px-1.5 pt-6 pb-1.5">
            <ProviderLogos providers={movie.providers} />
          </div>
        )}
      </div>
      <h3 className="mt-2.5 truncate text-sm font-medium text-tela/95 transition-colors group-hover:text-tela">{movie.title}</h3>
      <p className="mt-0.5 flex items-center gap-2.5 text-xs text-penumbra">
        <span>{movie.year ?? "—"}</span>
        {movie.rating > 0 && (
          <span className="flex items-center gap-0.5 text-projetor/90">
            <StarIcon className="size-3" />
            {formatRating(movie.rating)}
          </span>
        )}
      </p>
    </Link>
  );
}

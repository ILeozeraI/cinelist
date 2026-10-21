import { formatRating, formatRuntime } from "@/lib/format";
import { StarIcon } from "./Icons";

type Props = { rating: number; year: number | null; runtime: number | null; genres: string[]; className?: string };

/** Nota, ano, duração e gêneros, lado a lado. */
export function MovieMeta({ rating, year, runtime, genres, className = "" }: Props) {
  const duration = formatRuntime(runtime);

  return (
    <ul aria-label="Informações" className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-tela/85 ${className}`}>
      {rating > 0 && (
        <li title="Nota média do público no TMDB, de 0 a 10" className="flex items-center gap-1 font-semibold text-projetor">
          <StarIcon className="size-[1.05em]" />
          <span>
            <span className="sr-only">Nota </span>
            {formatRating(rating)}
          </span>
        </li>
      )}
      {year && <li>{year}</li>}
      {duration && <li>{duration}</li>}
      {genres.length > 0 && <li className="text-tela/65">{genres.slice(0, 3).join(", ")}</li>}
    </ul>
  );
}

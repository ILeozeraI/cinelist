import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/format";
import type { Movie } from "@/lib/tmdb/types";
import { RowScroller } from "./RowScroller";

const TITLE = "Top 10 nos streamings hoje";

/** Os 10 mais populares, com a posição em números enormes vazados atrás do pôster. */
export function TopTenRow({ movies }: { movies: Movie[] }) {
  const top = movies.filter((m) => m.posterPath).slice(0, 10);
  if (top.length === 0) return null;

  return (
    <section aria-labelledby="fileira-top-10" className="group/row">
      <div className="shell">
        <h2 id="fileira-top-10" className="font-display text-[1.65rem] leading-none font-bold tracking-[0.01em] md:text-[2rem]">
          {TITLE}
        </h2>
      </div>
      <RowScroller label={TITLE} as="ol">
        {top.map((movie, i) => (
          <li key={movie.id} className="shrink-0 snap-start">
            <Link
              href={`/filme/${movie.id}`}
              aria-label={`${i + 1}º lugar: ${movie.title}`}
              className="group flex items-end focus:outline-none"
            >
              <span
                aria-hidden
                className={`text-outline font-display text-[8.5rem] leading-[0.74] font-black tracking-[-0.06em] transition-[-webkit-text-stroke-color] select-none group-hover:[-webkit-text-stroke-color:var(--color-projetor)] group-focus-visible:[-webkit-text-stroke-color:var(--color-projetor)] md:text-[11rem] ${
                  i === 9 ? "-mr-5 md:-mr-7" : "-mr-3 md:-mr-4"
                }`}
              >
                {i + 1}
              </span>
              <span className="relative aspect-[2/3] w-28 overflow-hidden rounded-md bg-poltrona shadow-[-12px_0_24px_-8px_rgb(0_0_0/0.8)] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-projetor group-focus-visible:ring-2 group-focus-visible:ring-projetor md:w-36">
                <Image src={tmdbImage(movie.posterPath, "w342")!} alt="" fill sizes="150px" className="object-cover" />
              </span>
            </Link>
          </li>
        ))}
      </RowScroller>
    </section>
  );
}

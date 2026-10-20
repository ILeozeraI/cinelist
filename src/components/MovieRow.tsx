import Link from "next/link";
import type { Movie } from "@/lib/tmdb/types";
import { ChevronIcon } from "./Icons";
import { MovieCard } from "./MovieCard";
import { RowScroller } from "./RowScroller";

type Props = { title: string; href: string; movies: Movie[] };

function slug(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
}

export function MovieRow({ title, href, movies }: Props) {
  if (movies.length === 0) return null;
  const headingId = `fileira-${slug(title)}`;

  return (
    <section aria-labelledby={headingId} className="group/row">
      <div className="shell flex items-baseline gap-4">
        <h2 id={headingId} className="font-display text-[1.65rem] leading-none font-bold tracking-[0.01em] md:text-[2rem]">
          {title}
        </h2>
        <Link
          href={href}
          aria-label={`Ver todos de ${title}`}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-projetor/90 transition hover:text-projetor-claro focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor md:text-tela/0 md:group-hover/row:text-projetor md:focus-visible:text-projetor"
        >
          Ver tudo
          <ChevronIcon className="size-3.5" />
        </Link>
      </div>
      <RowScroller label={title}>
        {movies.map((movie) => (
          <li key={movie.id} className="w-[38vw] max-w-44 shrink-0 snap-start sm:w-40 md:w-44 md:max-w-none xl:w-48 2xl:w-52">
            <MovieCard movie={movie} />
          </li>
        ))}
      </RowScroller>
    </section>
  );
}

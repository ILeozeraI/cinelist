import Link from "next/link";
import type { Movie } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

type Props = { title: string; href: string; movies: Movie[] };

function slug(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
}

export function MovieRow({ title, href, movies }: Props) {
  if (movies.length === 0) return null;
  const headingId = `fileira-${slug(title)}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id={headingId} className="text-lg font-semibold md:text-xl">
          {title}
        </h2>
        <Link href={href} aria-label={`Ver todos de ${title}`} className="text-sm text-zinc-400 hover:text-yellow-400">
          ver tudo ›
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
        {movies.map((movie) => (
          <li key={movie.id} className="w-36 shrink-0 snap-start md:w-44">
            <MovieCard movie={movie} />
          </li>
        ))}
      </ul>
    </section>
  );
}

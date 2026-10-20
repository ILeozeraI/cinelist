import type { Movie } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

/** Pôsteres da primeira linha (5 colunas no desktop): ficam no topo da tela e carregam na hora. */
export const EAGER_POSTERS = 5;

export function MovieGrid({ movies }: { movies: Movie[] }) {
  return (
    <ul aria-label="Filmes" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {movies.map((movie, i) => (
        <li key={movie.id}>
          <MovieCard movie={movie} eager={i < EAGER_POSTERS} />
        </li>
      ))}
    </ul>
  );
}

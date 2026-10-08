import type { Movie } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

export function MovieGrid({ movies }: { movies: Movie[] }) {
  return (
    <ul aria-label="Filmes" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}

import { Hero } from "@/components/Hero";
import { MovieRow } from "@/components/MovieRow";
import { HOME_GENRES } from "@/lib/genres";
import { getFeatured, getGenreRow } from "@/lib/tmdb/movies";

// A Início é gerada no servidor e renovada a cada 6 horas.
export const revalidate = 21600;

export default async function HomePage() {
  const rowsPromise = Promise.allSettled(HOME_GENRES.map((genre) => getGenreRow(genre.id)));
  const [featuredResult] = await Promise.allSettled([getFeatured()]);
  const rowResults = await rowsPromise;

  // Só mostramos a tela de erro se nada carregou; uma fileira com falha apenas some.
  if (featuredResult.status === "rejected" && rowResults.every((r) => r.status === "rejected")) {
    throw featuredResult.reason;
  }
  const featured = featuredResult.status === "fulfilled" ? featuredResult.value : null;

  return (
    <div className="space-y-10">
      {featured && <Hero movie={featured} />}
      {HOME_GENRES.map((genre, i) => {
        const result = rowResults[i];
        return result.status === "fulfilled" ? (
          <MovieRow key={genre.id} title={genre.name} href={`/explorar?genero=${genre.id}`} movies={result.value} />
        ) : null;
      })}
    </div>
  );
}

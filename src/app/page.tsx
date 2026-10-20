import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { HomeGenreRows, HomeGenreRowsFallback } from "@/components/HomeGenreRows";
import { MovieRow } from "@/components/MovieRow";
import { TopTenRow } from "@/components/TopTenRow";
import { HOME_GENRES } from "@/lib/genres";
import { getFeatured, getGenreRow, getPopular } from "@/lib/tmdb/movies";

// A Início é gerada no servidor e renovada a cada 6 horas.
export const revalidate = 21600;

export default async function HomePage() {
  const rowsPromise = Promise.allSettled(HOME_GENRES.map((genre) => getGenreRow(genre.id)));
  const [featuredResult, popularResult] = await Promise.allSettled([getFeatured(), getPopular()]);
  const rowResults = await rowsPromise;

  // Só mostramos a tela de erro se nada carregou; uma fileira com falha apenas some.
  if (popularResult.status === "rejected" && rowResults.every((r) => r.status === "rejected")) {
    throw popularResult.reason;
  }
  const featured = featuredResult.status === "fulfilled" ? featuredResult.value : [];
  const popular = popularResult.status === "fulfilled" ? popularResult.value : [];
  const genreRows = HOME_GENRES.map((genre, i) => {
    const result = rowResults[i];
    return result.status === "fulfilled" ? (
      <MovieRow key={genre.id} title={genre.name} href={`/explorar?genero=${genre.id}`} movies={result.value} />
    ) : null;
  });

  return (
    <div className="relative isolate overflow-x-clip">
      {featured.length > 0 ? <Hero movies={featured} /> : <div className="page-top" />}
      <div className={`relative space-y-10 md:space-y-14 ${featured.length > 0 ? "-mt-8 md:-mt-36" : ""}`}>
        <TopTenRow movies={popular} />
        {/* A nota é lida do link no navegador, assim a Início continua pronta e guardada no servidor. */}
        <Suspense fallback={<HomeGenreRowsFallback>{genreRows}</HomeGenreRowsFallback>}>
          <HomeGenreRows>{genreRows}</HomeGenreRows>
        </Suspense>
      </div>
    </div>
  );
}

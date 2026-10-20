"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadRatedGenreRows } from "@/app/actions";
import { DEFAULT_FILTERS, HOME_RATING_PRESETS, parseHomeRating, serializeFilters } from "@/lib/filters";
import type { GenreRow } from "@/lib/tmdb/types";
import { StarIcon } from "./Icons";
import { MovieRow } from "./MovieRow";
import { SkeletonRows } from "./Skeletons";

/** Fileiras que chegaram do servidor para uma nota; `null` = a busca falhou. */
type Loaded = { rating: number; rows: GenreRow[] | null };

const pillClass =
  "inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-projetor";

function RatingPresets({ value, onSelect }: { value: number | null; onSelect: (rating: number | null) => void }) {
  const options = [null, ...HOME_RATING_PRESETS];
  return (
    <div className="shell flex flex-wrap items-center gap-x-4 gap-y-2">
      <span id="filtro-nota-inicio" className="text-sm font-semibold text-tela/90">
        Filtrar por nota
      </span>
      <div role="group" aria-labelledby="filtro-nota-inicio" className="flex gap-2">
        {options.map((rating) => {
          const active = rating === value;
          return (
            <button
              key={rating ?? "todos"}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(rating)}
              className={`${pillClass} ${
                active
                  ? "border-projetor bg-projetor text-sala"
                  : "border-white/10 bg-black/40 text-tela/85 backdrop-blur-md hover:border-white/25 hover:text-tela"
              }`}
            >
              {rating === null ? (
                "Todos"
              ) : (
                <>
                  <StarIcon className="size-3" />
                  {rating}+
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** O que a Início mostra antes de ler a nota do link: botões em "Todos" e as fileiras normais. */
export function HomeGenreRowsFallback({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RatingPresets value={null} onSelect={() => {}} />
      {children}
    </>
  );
}

/**
 * Botões de nota da Início e as fileiras de gênero. Sem nota, mostra `children` (as fileiras
 * normais, que vêm prontas do servidor); com nota, busca fileiras novas só com filmes acima dela.
 */
export function HomeGenreRows({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const urlRating = parseHomeRating(useSearchParams().get("nota"));
  // Cópia local: o botão marca na hora do clique. Se o link mudar por fora, a cópia é refeita.
  const [rating, setRating] = useState(urlRating);
  const [lastUrlRating, setLastUrlRating] = useState(urlRating);
  if (urlRating !== lastUrlRating) {
    setLastUrlRating(urlRating);
    setRating(urlRating);
  }
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (rating === null) return;
    let current = true; // ignora a resposta se outra nota foi escolhida antes de ela chegar
    loadRatedGenreRows(rating).then(
      (rows) => current && setLoaded({ rating, rows }),
      () => current && setLoaded({ rating, rows: null }),
    );
    return () => {
      current = false;
    };
  }, [rating]);

  function select(next: number | null) {
    setRating(next);
    window.history.replaceState(null, "", next === null ? pathname : `${pathname}?nota=${next}`);
  }

  const rows = rating !== null && loaded?.rating === rating ? loaded.rows : undefined;

  return (
    <>
      <RatingPresets value={rating} onSelect={select} />
      {rating === null ? (
        children
      ) : rows === undefined ? (
        <SkeletonRows />
      ) : rows === null ? (
        <p role="status" className="shell text-penumbra">
          Não foi possível filtrar agora. Tente de novo.
        </p>
      ) : rows.length === 0 ? (
        <p role="status" className="shell text-penumbra">
          Nenhum filme com nota {rating}+ por aqui. Tente uma nota menor.
        </p>
      ) : (
        rows.map(({ genre, movies }) => (
          <MovieRow
            key={genre.id}
            title={genre.name}
            href={`/explorar?${serializeFilters({ ...DEFAULT_FILTERS, genreId: genre.id, minRating: rating })}`}
            movies={movies}
          />
        ))
      )}
    </>
  );
}

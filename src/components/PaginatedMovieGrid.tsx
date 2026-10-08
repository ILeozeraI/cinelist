"use client";

import { useRef, useState } from "react";
import type { Movie, Page } from "@/lib/tmdb/types";
import { MovieGrid } from "./MovieGrid";

type Props = {
  initial: Page<Movie>;
  loadPage: (page: number) => Promise<Page<Movie>>;
  /** Mostrada quando não há nenhum filme e não existem mais páginas. */
  emptyMessage?: string;
};

export function PaginatedMovieGrid({ initial, loadPage, emptyMessage }: Props) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const busy = useRef(false);

  async function loadMore() {
    if (busy.current) return;
    busy.current = true;
    setStatus("loading");
    try {
      const next = await loadPage(page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...next.items.filter((m) => !seen.has(m.id))];
      });
      setPage(next.page);
      setTotalPages(next.totalPages);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="space-y-6">
      {items.length > 0 && <MovieGrid movies={items} />}
      {items.length === 0 && page >= totalPages && emptyMessage && <p className="text-zinc-400">{emptyMessage}</p>}
      {items.length === 0 && page < totalPages && (
        <p className="text-zinc-400">
          Ainda não encontramos esse filme nos streamings. Carregue mais para continuar procurando.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-center text-sm text-red-400">
          Não foi possível carregar mais filmes. Tente de novo.
        </p>
      )}
      {page < totalPages && (
        <div className="text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loading"}
            className="rounded-full border border-zinc-700 px-6 py-2 text-sm font-semibold hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50"
          >
            {status === "loading" ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  );
}

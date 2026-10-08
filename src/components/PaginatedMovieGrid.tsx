"use client";

import { useRef, useState } from "react";
import type { Movie, Page } from "@/lib/tmdb/types";
import { MovieGrid } from "./MovieGrid";

type Props = {
  initial: Page<Movie>;
  loadPage: (page: number) => Promise<Page<Movie>>;
};

export function PaginatedMovieGrid({ initial, loadPage }: Props) {
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
      <MovieGrid movies={items} />
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

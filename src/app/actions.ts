"use server";

import { parseFilters, parsePage } from "@/lib/filters";
import { discoverMovies, searchMovies } from "@/lib/tmdb/movies";
import type { Movie, Page } from "@/lib/tmdb/types";

// Server Actions são endpoints públicos: valide tudo o que chega.
function requirePage(page: number): number {
  const valid = parsePage(page);
  if (valid === null) throw new Error("Página inválida");
  return valid;
}

export async function loadMoreDiscover(query: string, page: number): Promise<Page<Movie>> {
  const filters = parseFilters(Object.fromEntries(new URLSearchParams(query)));
  return discoverMovies(filters, requirePage(page));
}

export async function loadMoreSearch(q: string, page: number): Promise<Page<Movie>> {
  return searchMovies(q, requirePage(page));
}

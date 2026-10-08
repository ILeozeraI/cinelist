"use server";

import { MAX_QUERY_LENGTH, parseFilters, parsePage } from "@/lib/filters";
import { discoverMovies, searchMovies } from "@/lib/tmdb/movies";
import type { Movie, Page } from "@/lib/tmdb/types";

// Server Actions são endpoints públicos: valide tudo o que chega.
function requirePage(page: number): number {
  const valid = parsePage(page);
  if (valid === null) throw new Error("Página inválida");
  return valid;
}

export async function loadMoreDiscover(query: string, page: number): Promise<Page<Movie>> {
  if (typeof query !== "string") throw new Error("Busca inválida");
  const filters = parseFilters(Object.fromEntries(new URLSearchParams(query)));
  return discoverMovies(filters, requirePage(page));
}

export async function loadMoreSearch(q: string, page: number): Promise<Page<Movie>> {
  if (typeof q !== "string") throw new Error("Busca inválida");
  return searchMovies(q.trim().slice(0, MAX_QUERY_LENGTH), requirePage(page));
}

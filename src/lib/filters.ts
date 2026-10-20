import { ALL_GENRES } from "./genres";
import type { DiscoverFilters, SortOption } from "./tmdb/types";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS: readonly SortOption[] = ["popularidade", "nota", "lancamento"];
export const MIN_YEAR = 1900;
/** Tamanho máximo do texto de busca. */
export const MAX_QUERY_LENGTH = 100;
/** O TMDB não devolve páginas além da 500. */
export const MAX_PAGE = 500;

export const DEFAULT_FILTERS: DiscoverFilters = {
  providerIds: [],
  genreId: null,
  yearFrom: null,
  yearTo: null,
  minRating: null,
  sort: "popularidade",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function parseFilters(sp: SearchParamsInput, currentYear = new Date().getFullYear()): DiscoverFilters {
  const providerIds = [
    ...new Set(
      (first(sp.streaming) ?? "")
        .split(",")
        .map((s) => positiveInt(s.trim()))
        .filter((n): n is number => n !== null),
    ),
  ];

  const genre = positiveInt(first(sp.genero));
  const genreId = genre !== null && ALL_GENRES.some((g) => g.id === genre) ? genre : null;

  const year = (value: string | string[] | undefined) => {
    const n = positiveInt(first(value));
    return n !== null && n >= MIN_YEAR && n <= currentYear + 1 ? n : null;
  };
  let yearFrom = year(sp.de);
  let yearTo = year(sp.ate);
  if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];

  const ratingRaw = first(sp.nota);
  const rating = ratingRaw && /^\d+(\.\d+)?$/.test(ratingRaw) ? Number(ratingRaw) : NaN;
  const minRating = rating > 0 && rating <= 9 && Number.isInteger(rating * 2) ? rating : null;

  const order = first(sp.ordem);
  const sort = SORT_OPTIONS.find((o) => o === order) ?? DEFAULT_FILTERS.sort;

  return { providerIds, genreId, yearFrom, yearTo, minRating, sort };
}

export function serializeFilters(f: DiscoverFilters): string {
  const p = new URLSearchParams();
  if (f.providerIds.length > 0) p.set("streaming", f.providerIds.join(","));
  if (f.genreId !== null) p.set("genero", String(f.genreId));
  if (f.yearFrom !== null) p.set("de", String(f.yearFrom));
  if (f.yearTo !== null) p.set("ate", String(f.yearTo));
  if (f.minRating !== null) p.set("nota", String(f.minRating));
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("ordem", f.sort);
  return p.toString();
}

/** Notas mínimas dos botões da Início ("7+", "8+", "9+"); sem nota é "Todos". */
export const HOME_RATING_PRESETS: readonly number[] = [7, 8, 9];

/** Lê o `?nota=` da Início; qualquer valor fora dos botões vale como "Todos". */
export function parseHomeRating(raw: string | null): number | null {
  return HOME_RATING_PRESETS.find((r) => String(r) === raw) ?? null;
}

export function parseMovieId(raw: string): number | null {
  return positiveInt(raw);
}

export function parsePage(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_PAGE ? value : null;
}

/** Id de filme válido (mesma regra de `positiveInt`), para o que chega de fora tipado como `unknown`. */
export function isMovieId(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0;
}

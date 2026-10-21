import "server-only";
import { cache } from "react";
import { MAX_PAGE } from "@/lib/filters";
import { HOME_GENRES } from "@/lib/genres";
import { dedupeMovieRows } from "@/lib/rows";
import { REVALIDATE, TmdbError, tmdbFetch, type TmdbParams } from "./client";
import { mapBrFlatrate, mapMovie, mapMovieDetails, mapProvider } from "./mappers";
import type {
  DiscoverFilters,
  FeaturedMovie,
  GenreRow,
  Movie,
  MovieDetails,
  Page,
  Provider,
  SortOption,
  TmdbMovie,
  TmdbMovieDetails,
  TmdbPaged,
  TmdbProvider,
  TmdbWatchProviders,
} from "./types";

/** Streamings por assinatura no Brasil (verificados em docs/superpowers/notes/2026-10-08-verificacao-tmdb.md). */
export const SUBSCRIPTION_PROVIDER_IDS: readonly number[] = [8, 119, 350, 337, 167, 47, 531, 1899, 307, 283, 11, 19, 190];
export const PROVIDER_OPTIONS_LIMIT = 8;

/** Sem um mínimo de votos, filtrar ou ordenar por nota traz filmes obscuros com nota 10 dada por 3 pessoas. */
const MIN_VOTES_FOR_RATING = 200;
const MAX_SEARCH_PAGES_PER_CALL = 3;

const SORT_PARAM: Record<SortOption, string> = {
  popularidade: "popularity.desc",
  nota: "vote_average.desc",
  lancamento: "primary_release_date.desc",
};

const brPriority = (p: TmdbProvider) => p.display_priorities?.BR ?? p.display_priority ?? Number.MAX_SAFE_INTEGER;

export const getProviderOptions = cache(async (): Promise<Provider[]> => {
  const data = await tmdbFetch<{ results: TmdbProvider[] }>("/watch/providers/movie", { watch_region: "BR" }, REVALIDATE.long);
  return data.results
    .filter((p) => SUBSCRIPTION_PROVIDER_IDS.includes(p.provider_id))
    .sort((a, b) => brPriority(a) - brPriority(b))
    .slice(0, PROVIDER_OPTIONS_LIMIT)
    .map(mapProvider);
});

export const getMovieProviders = cache(async (id: number): Promise<Provider[]> => {
  try {
    const data = await tmdbFetch<TmdbWatchProviders>(`/movie/${id}/watch/providers`, {}, REVALIDATE.short);
    return mapBrFlatrate(data);
  } catch {
    return [];
  }
});

async function withProviders(movies: TmdbMovie[]): Promise<Movie[]> {
  return Promise.all(movies.map(async (m) => mapMovie(m, await getMovieProviders(m.id))));
}

async function effectiveProviderIds(filters: DiscoverFilters): Promise<number[]> {
  if (filters.providerIds.length > 0) return filters.providerIds;
  return (await getProviderOptions()).map((p) => p.id);
}

function discoverParams(filters: DiscoverFilters, providerIds: number[], page: number): TmdbParams {
  return {
    watch_region: "BR",
    with_watch_monetization_types: "flatrate",
    with_watch_providers: providerIds.join("|"),
    with_genres: filters.genreId ?? undefined,
    "primary_release_date.gte": filters.yearFrom ? `${filters.yearFrom}-01-01` : undefined,
    "primary_release_date.lte": filters.yearTo ? `${filters.yearTo}-12-31` : undefined,
    "vote_average.gte": filters.minRating ?? undefined,
    "vote_count.gte": filters.sort === "nota" || filters.minRating !== null ? MIN_VOTES_FOR_RATING : undefined,
    sort_by: SORT_PARAM[filters.sort],
    include_adult: "false",
    page,
  };
}

export async function discoverMovies(filters: DiscoverFilters, page = 1): Promise<Page<Movie>> {
  const providerIds = await effectiveProviderIds(filters);
  const data = await tmdbFetch<TmdbPaged<TmdbMovie>>("/discover/movie", discoverParams(filters, providerIds, page), REVALIDATE.short);
  return {
    items: await withProviders(data.results),
    page: data.page,
    totalPages: Math.min(data.total_pages, MAX_PAGE),
  };
}

const POPULAR: DiscoverFilters = {
  providerIds: [],
  genreId: null,
  yearFrom: null,
  yearTo: null,
  minRating: null,
  sort: "popularidade",
};

export async function getGenreRow(genreId: number, minRating: number | null = null): Promise<Movie[]> {
  return (await discoverMovies({ ...POPULAR, genreId, minRating })).items;
}

/** As fileiras de gênero da Início com nota mínima; a que vem vazia ou falha some. */
export async function getRatedGenreRows(minRating: number): Promise<GenreRow[]> {
  const results = await Promise.allSettled(HOME_GENRES.map((genre) => getGenreRow(genre.id, minRating)));
  if (results.every((r) => r.status === "rejected")) throw (results[0] as PromiseRejectedResult).reason;
  const unique = dedupeMovieRows(results.map((r) => (r.status === "fulfilled" ? r.value : [])));
  return HOME_GENRES.flatMap((genre, i) => (unique[i].length > 0 ? [{ genre, movies: unique[i] }] : []));
}

export const FEATURED_COUNT = 5;

/** Os mais populares nos streamings agora, em ordem (alimenta o destaque e o Top 10). */
export const getPopular = cache(async (): Promise<Movie[]> => (await discoverMovies(POPULAR)).items);

/** Os primeiros populares com imagem de fundo, já com sinopse, duração e gêneros. */
export async function getFeatured(): Promise<FeaturedMovie[]> {
  const picks = (await getPopular())
    .map((movie, i) => ({ movie, rank: i + 1 }))
    .filter(({ movie }) => movie.backdropPath !== null)
    .slice(0, FEATURED_COUNT);
  const details = await Promise.all(
    picks.map(async ({ movie, rank }) => {
      const d = await getMovieDetails(movie.id).catch(() => null);
      return d && d.backdropPath ? { ...d, rank } : null;
    }),
  );
  return details.filter((d) => d !== null);
}

export async function searchMovies(query: string, startPage = 1): Promise<Page<Movie>> {
  const q = query.trim();
  if (!q) return { items: [], page: 0, totalPages: 0 };

  const items: Movie[] = [];
  let lastPage = startPage;
  let totalPages = 0;
  for (let page = startPage; page < startPage + MAX_SEARCH_PAGES_PER_CALL; page++) {
    const data = await tmdbFetch<TmdbPaged<TmdbMovie>>(
      "/search/movie",
      { query: q, region: "BR", include_adult: "false", page },
      REVALIDATE.short,
    );
    lastPage = page;
    totalPages = Math.min(data.total_pages, MAX_PAGE);
    items.push(...(await withProviders(data.results)).filter((m) => m.providers.length > 0));
    if (items.length > 0 || page >= totalPages) break;
  }
  return { items, page: lastPage, totalPages };
}

export const getMovieDetails = cache(async (id: number): Promise<MovieDetails | null> => {
  try {
    const data = await tmdbFetch<TmdbMovieDetails>(
      `/movie/${id}`,
      { append_to_response: "videos,watch/providers", include_video_language: "pt,en" },
      REVALIDATE.long,
    );
    return mapMovieDetails(data);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
});

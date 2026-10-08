import "server-only";
import { MAX_PAGE } from "@/lib/filters";
import { REVALIDATE, TmdbError, tmdbFetch, type TmdbParams } from "./client";
import { mapBrFlatrate, mapMovie, mapMovieDetails, mapProvider } from "./mappers";
import type {
  DiscoverFilters,
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

const MIN_VOTES_FOR_RATING_SORT = 200;
const MAX_SEARCH_PAGES_PER_CALL = 3;

const SORT_PARAM: Record<SortOption, string> = {
  popularidade: "popularity.desc",
  nota: "vote_average.desc",
  lancamento: "primary_release_date.desc",
};

const brPriority = (p: TmdbProvider) => p.display_priorities?.BR ?? p.display_priority ?? Number.MAX_SAFE_INTEGER;

export async function getProviderOptions(): Promise<Provider[]> {
  const data = await tmdbFetch<{ results: TmdbProvider[] }>("/watch/providers/movie", { watch_region: "BR" }, REVALIDATE.long);
  return data.results
    .filter((p) => SUBSCRIPTION_PROVIDER_IDS.includes(p.provider_id))
    .sort((a, b) => brPriority(a) - brPriority(b))
    .slice(0, PROVIDER_OPTIONS_LIMIT)
    .map(mapProvider);
}

export async function getMovieProviders(id: number): Promise<Provider[]> {
  try {
    const data = await tmdbFetch<TmdbWatchProviders>(`/movie/${id}/watch/providers`, {}, REVALIDATE.short);
    return mapBrFlatrate(data);
  } catch {
    return [];
  }
}

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
    "vote_count.gte": filters.sort === "nota" ? MIN_VOTES_FOR_RATING_SORT : undefined,
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

export async function getGenreRow(genreId: number): Promise<Movie[]> {
  return (await discoverMovies({ ...POPULAR, genreId })).items;
}

export async function getFeatured(): Promise<Movie | null> {
  return (await discoverMovies(POPULAR)).items.find((m) => m.backdropPath !== null) ?? null;
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

export async function getMovieDetails(id: number): Promise<MovieDetails | null> {
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
}

import type { TmdbMovie, TmdbMovieDetails, TmdbPaged, TmdbProvider, TmdbVideo, TmdbWatchProviders } from "@/lib/tmdb/types";

export const netflix: TmdbProvider = { provider_id: 8, provider_name: "Netflix", logo_path: "/netflix.jpg", display_priority: 5, display_priorities: { BR: 1 } };
export const prime: TmdbProvider = { provider_id: 119, provider_name: "Amazon Prime Video", logo_path: "/prime.jpg", display_priority: 1, display_priorities: { BR: 2 } };
export const disney: TmdbProvider = { provider_id: 337, provider_name: "Disney Plus", logo_path: "/disney.jpg", display_priority: 2, display_priorities: { BR: 3 } };
/** Loja de aluguel/compra: nunca deve virar opção de assinatura. */
export const appleStore: TmdbProvider = { provider_id: 2, provider_name: "Apple TV", logo_path: "/apple.jpg", display_priority: 0, display_priorities: { BR: 0 } };

export const duna: TmdbMovie = {
  id: 693134,
  title: "Duna: Parte Dois",
  release_date: "2024-02-27",
  vote_average: 8.15,
  poster_path: "/duna.jpg",
  backdrop_path: "/duna-bg.jpg",
  overview: "Paul Atreides se une a Chani e aos Fremen.",
};

export const semPoster: TmdbMovie = { id: 1, title: "Filme Raro", release_date: "", vote_average: 0, poster_path: null, backdrop_path: null };

export function providersBr(...ps: TmdbProvider[]): TmdbWatchProviders {
  return { results: { BR: { link: "https://www.themoviedb.org/movie/x/watch?locale=BR", flatrate: ps } } };
}

export function video(over: Partial<TmdbVideo> = {}): TmdbVideo {
  return { key: "abc", name: "Trailer", site: "YouTube", type: "Trailer", official: true, iso_639_1: "en", iso_3166_1: "US", ...over };
}

export const dunaDetails: TmdbMovieDetails = {
  ...duna,
  runtime: 166,
  videos: { results: [video({ key: "en1" }), video({ key: "pt1", iso_639_1: "pt", iso_3166_1: "BR" })] },
  "watch/providers": providersBr(prime),
};

export function paged<T>(results: T[], page = 1, totalPages = 1): TmdbPaged<T> {
  return { page, results, total_pages: totalPages, total_results: results.length };
}

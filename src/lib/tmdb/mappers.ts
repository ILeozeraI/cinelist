import { pickTrailer } from "../trailer";
import type { Movie, MovieDetails, Provider, TmdbMovie, TmdbMovieDetails, TmdbProvider, TmdbWatchProviders } from "./types";

export function toYear(date?: string): number | null {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

export function mapProvider(p: TmdbProvider): Provider {
  return { id: p.provider_id, name: p.provider_name, logoPath: p.logo_path ?? null };
}

export function mapBrFlatrate(wp: TmdbWatchProviders | undefined): Provider[] {
  return (wp?.results?.BR?.flatrate ?? []).map(mapProvider);
}

export function mapMovie(m: TmdbMovie, providers: Provider[] = []): Movie {
  return {
    id: m.id,
    title: m.title,
    year: toYear(m.release_date),
    rating: m.vote_average ?? 0,
    posterPath: m.poster_path ?? null,
    backdropPath: m.backdrop_path ?? null,
    providers,
  };
}

export function mapMovieDetails(d: TmdbMovieDetails): MovieDetails {
  return {
    ...mapMovie(d, mapBrFlatrate(d["watch/providers"])),
    overview: d.overview?.trim() ?? "",
    runtime: d.runtime && d.runtime > 0 ? d.runtime : null,
    genres: (d.genres ?? []).map((g) => g.name),
    trailer: pickTrailer(d.videos?.results ?? []),
  };
}

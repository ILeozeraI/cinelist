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

/** Tira do nome o que só diz o plano ou o canal: "Amazon Prime Video with Ads" vira "Amazon Prime Video". */
const VARIANT_SUFFIX = /\s+(?:(?:Standard )?with Ads|Premium|(?:Amazon|Apple TV|Roku Premium|Claro)\s+Channel|Channel)$/i;

export function serviceName(name: string): string {
  return name.replace(VARIANT_SUFFIX, "").trim();
}

/** Um logo por serviço: o plano com anúncios ou o canal só aparece se o serviço principal não estiver na lista. */
export function dedupeServices(providers: Provider[]): Provider[] {
  const plain = providers.filter((p) => serviceName(p.name) === p.name);
  const variants = providers.filter((p) => serviceName(p.name) !== p.name);
  const seen = new Set<string>();
  const kept = new Set<Provider>();
  for (const p of [...plain, ...variants]) {
    const key = serviceName(p.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.add(p);
  }
  return providers.filter((p) => kept.has(p));
}

export function mapBrFlatrate(wp: TmdbWatchProviders | undefined): Provider[] {
  return dedupeServices((wp?.results?.BR?.flatrate ?? []).map(mapProvider));
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

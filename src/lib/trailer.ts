import type { Trailer, TmdbVideo } from "./tmdb/types";

const NOT_ALLOWED = Number.POSITIVE_INFINITY;

/** pt oficial (0) > pt (1) > en oficial (2) > en (3); demais idiomas ficam de fora. */
function rank(v: TmdbVideo): number {
  if (v.iso_639_1 === "pt") return v.official ? 0 : 1;
  if (v.iso_639_1 === "en") return v.official ? 2 : 3;
  return NOT_ALLOWED;
}

export function pickTrailer(videos: TmdbVideo[]): Trailer | null {
  const best = videos
    .filter((v) => v.site === "YouTube" && v.type === "Trailer" && rank(v) !== NOT_ALLOWED)
    .sort((a, b) => rank(a) - rank(b))[0];
  return best ? { key: best.key, name: best.name } : null;
}

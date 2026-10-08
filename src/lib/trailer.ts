import type { Trailer, TmdbVideo } from "./tmdb/types";

const NOT_ALLOWED = Number.POSITIVE_INFINITY;

/** pt-BR oficial (0) > pt-BR (1) > pt oficial (2) > pt (3) > en oficial (4) > en (5); demais idiomas ficam de fora. */
function rank(v: TmdbVideo): number {
  if (v.iso_639_1 === "pt") {
    const base = v.iso_3166_1 === "BR" ? 0 : 2;
    return base + (v.official ? 0 : 1);
  }
  if (v.iso_639_1 === "en") return v.official ? 4 : 5;
  return NOT_ALLOWED;
}

export function pickTrailer(videos: TmdbVideo[]): Trailer | null {
  const best = videos
    .filter((v) => v.site === "YouTube" && v.type === "Trailer" && rank(v) !== NOT_ALLOWED)
    .sort((a, b) => rank(a) - rank(b))[0];
  return best ? { key: best.key, name: best.name } : null;
}

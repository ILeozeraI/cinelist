export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageSize = "w92" | "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original";

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

export function tmdbImage(path: string | null, size: ImageSize): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

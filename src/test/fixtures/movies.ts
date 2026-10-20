import type { FeaturedMovie, Movie, Provider } from "@/lib/tmdb/types";

export const netflixProvider: Provider = { id: 8, name: "Netflix", logoPath: "/netflix.jpg" };
export const primeProvider: Provider = { id: 119, name: "Amazon Prime Video", logoPath: "/prime.jpg" };

export function makeMovie(over: Partial<Movie> = {}): Movie {
  return {
    id: 693134,
    title: "Duna: Parte Dois",
    year: 2024,
    rating: 8.2,
    posterPath: "/duna.jpg",
    backdropPath: "/duna-bg.jpg",
    providers: [netflixProvider],
    ...over,
  };
}

export function makeFeatured(over: Partial<FeaturedMovie> = {}): FeaturedMovie {
  return {
    ...makeMovie(),
    overview: "Paul Atreides se une a Chani e aos Fremen.",
    runtime: 166,
    genres: ["Ficção científica", "Aventura"],
    trailer: null,
    rank: 1,
    ...over,
  };
}

import type { Genre } from "./tmdb/types";

/** Fileiras da Início, nesta ordem (spec 3.3). */
export const HOME_GENRES: Genre[] = [
  { id: 28, name: "Ação" },
  { id: 35, name: "Comédia" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Terror" },
  { id: 878, name: "Ficção científica" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animação" },
  { id: 53, name: "Suspense" },
  { id: 80, name: "Crime" },
  { id: 12, name: "Aventura" },
];

/** Os 19 gêneros de filme do TMDB, em ordem alfabética, para o filtro do Explorar. */
export const ALL_GENRES: Genre[] = [
  { id: 28, name: "Ação" },
  { id: 16, name: "Animação" },
  { id: 12, name: "Aventura" },
  { id: 10770, name: "Cinema TV" },
  { id: 35, name: "Comédia" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentário" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Família" },
  { id: 14, name: "Fantasia" },
  { id: 37, name: "Faroeste" },
  { id: 878, name: "Ficção científica" },
  { id: 10752, name: "Guerra" },
  { id: 36, name: "História" },
  { id: 9648, name: "Mistério" },
  { id: 10402, name: "Música" },
  { id: 10749, name: "Romance" },
  { id: 53, name: "Suspense" },
  { id: 27, name: "Terror" },
];

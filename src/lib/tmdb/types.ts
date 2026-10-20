// ---------- Tipos do app (o que os componentes conhecem) ----------

export type Provider = { id: number; name: string; logoPath: string | null };

export type Movie = {
  id: number;
  title: string;
  year: number | null;
  rating: number;
  posterPath: string | null;
  backdropPath: string | null;
  providers: Provider[];
};

export type Trailer = { key: string; name: string };

export type MovieDetails = Movie & {
  overview: string;
  runtime: number | null;
  genres: string[];
  trailer: Trailer | null;
};

/** Filme do destaque da Início; `rank` é a posição dele entre os mais populares. */
export type FeaturedMovie = MovieDetails & { rank: number };

export type Genre = { id: number; name: string };

/** Uma fileira de gênero da Início, já com os filmes. */
export type GenreRow = { genre: Genre; movies: Movie[] };

export type SortOption = "popularidade" | "nota" | "lancamento";

export type DiscoverFilters = {
  providerIds: number[];
  genreId: number | null;
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  sort: SortOption;
};

export type Page<T> = { items: T[]; page: number; totalPages: number };

// ---------- Respostas cruas do TMDB (só lib/tmdb conhece) ----------

export type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  vote_average?: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
};

export type TmdbPaged<T> = { page: number; results: T[]; total_pages: number; total_results: number };

export type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
  display_priorities?: Record<string, number>;
};

export type TmdbWatchProviders = {
  results?: Record<string, { link?: string; flatrate?: TmdbProvider[] }>;
};

export type TmdbVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  iso_3166_1: string;
};

export type TmdbMovieDetails = TmdbMovie & {
  runtime: number | null;
  genres?: { id: number; name: string }[];
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
};

import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { appleStore, disney, duna, dunaDetails, netflix, paged, prime, providersBr, semPoster } from "@/test/fixtures/tmdb";
import { REVALIDATE, TmdbError, tmdbFetch, type TmdbParams } from "./client";
import {
  discoverMovies,
  getFeatured,
  getGenreRow,
  getMovieDetails,
  getMovieProviders,
  getProviderOptions,
  getRatedGenreRows,
  PROVIDER_OPTIONS_LIMIT,
  searchMovies,
  SUBSCRIPTION_PROVIDER_IDS,
} from "./movies";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  tmdbFetch: vi.fn(),
}));

type Call = { path: string; params: TmdbParams; revalidate?: number };
type Handler = (params: TmdbParams) => unknown;

const calls: Call[] = [];
const callsTo = (path: string) => calls.filter((c) => c.path === path);

/** Simula o TMDB: cada caminho tem uma resposta; caminho sem resposta = 404. */
function route(handlers: Record<string, Handler>) {
  vi.mocked(tmdbFetch).mockImplementation((async (path: string, params: TmdbParams = {}, revalidate?: number) => {
    calls.push({ path, params, revalidate });
    const handler = handlers[path];
    if (!handler) throw new TmdbError(404, `sem rota: ${path}`);
    const result = handler(params);
    if (result instanceof Error) throw result;
    return result;
  }) as typeof tmdbFetch);
}

const optionsRoute: Record<string, Handler> = {
  "/watch/providers/movie": () => ({ results: [prime, appleStore, netflix, disney] }),
};

beforeEach(() => {
  calls.length = 0;
  vi.mocked(tmdbFetch).mockReset();
});

describe("getProviderOptions", () => {
  it("mantém só assinaturas e ordena pela prioridade no Brasil", async () => {
    route(optionsRoute);
    expect(await getProviderOptions()).toEqual([
      { id: 8, name: "Netflix", logoPath: "/netflix.jpg" },
      { id: 119, name: "Amazon Prime Video", logoPath: "/prime.jpg" },
      { id: 337, name: "Disney Plus", logoPath: "/disney.jpg" },
    ]);
    const [call] = callsTo("/watch/providers/movie");
    expect(call.params).toMatchObject({ watch_region: "BR" });
    expect(call.revalidate).toBe(REVALIDATE.long);
  });

  it(`limita a ${PROVIDER_OPTIONS_LIMIT} opções`, async () => {
    const many = SUBSCRIPTION_PROVIDER_IDS.map((id, i) => ({
      provider_id: id, provider_name: `P${id}`, logo_path: `/p${id}.jpg`, display_priorities: { BR: i },
    }));
    route({ "/watch/providers/movie": () => ({ results: many }) });
    expect(await getProviderOptions()).toHaveLength(Math.min(PROVIDER_OPTIONS_LIMIT, SUBSCRIPTION_PROVIDER_IDS.length));
  });
});

describe("getMovieProviders", () => {
  it("falha vira lista vazia", async () => {
    route({});
    expect(await getMovieProviders(42)).toEqual([]);
  });
});

describe("discoverMovies", () => {
  it("sem streaming marcado usa a união das opções e busca os logos de cada filme", async () => {
    route({
      ...optionsRoute,
      "/discover/movie": () => paged([duna, semPoster], 1, 7),
      "/movie/693134/watch/providers": () => providersBr(netflix),
    });

    const result = await discoverMovies(DEFAULT_FILTERS);

    const [call] = callsTo("/discover/movie");
    expect(call.params).toMatchObject({
      watch_region: "BR",
      with_watch_monetization_types: "flatrate",
      with_watch_providers: "8|119|337",
      sort_by: "popularity.desc",
      page: 1,
    });
    expect(call.revalidate).toBe(REVALIDATE.short);
    expect(result).toMatchObject({ page: 1, totalPages: 7 });
    expect(result.items.map((m) => m.id)).toEqual([693134, 1]);
    expect(result.items[0].providers).toEqual([{ id: 8, name: "Netflix", logoPath: "/netflix.jpg" }]);
    expect(result.items[1].providers).toEqual([]); // falha nos logos não derruba o card
  });

  it("traduz todos os filtros para a consulta", async () => {
    route({ "/discover/movie": () => paged([]) });
    await discoverMovies({ providerIds: [8], genreId: 27, yearFrom: 2000, yearTo: 2024, minRating: 6.5, sort: "nota" }, 3);

    expect(callsTo("/watch/providers/movie")).toHaveLength(0);
    expect(callsTo("/discover/movie")[0].params).toMatchObject({
      with_watch_providers: "8",
      with_genres: 27,
      "primary_release_date.gte": "2000-01-01",
      "primary_release_date.lte": "2024-12-31",
      "vote_average.gte": 6.5,
      "vote_count.gte": 200,
      sort_by: "vote_average.desc",
      page: 3,
    });
  });

  it("ordenar por lançamento não exige mínimo de votos", async () => {
    route({ "/discover/movie": () => paged([]) });
    await discoverMovies({ ...DEFAULT_FILTERS, providerIds: [8], sort: "lancamento" });
    const params = callsTo("/discover/movie")[0].params;
    expect(params.sort_by).toBe("primary_release_date.desc");
    expect(params["vote_count.gte"]).toBeUndefined();
  });

  it("nota mínima exige o mínimo de votos mesmo ordenando por popularidade", async () => {
    route({ "/discover/movie": () => paged([]) });
    await discoverMovies({ ...DEFAULT_FILTERS, providerIds: [8], minRating: 8 });
    expect(callsTo("/discover/movie")[0].params).toMatchObject({
      "vote_average.gte": 8,
      "vote_count.gte": 200,
      sort_by: "popularity.desc",
    });
  });

  it("limita o total de páginas a 500", async () => {
    route({ "/discover/movie": () => paged([], 1, 9000) });
    expect((await discoverMovies({ ...DEFAULT_FILTERS, providerIds: [8] })).totalPages).toBe(500);
  });
});

describe("getGenreRow e getFeatured", () => {
  it("fileira de gênero ordenada por popularidade", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([duna]), "/movie/693134/watch/providers": () => providersBr(netflix) });
    const row = await getGenreRow(27);
    expect(row.map((m) => m.title)).toEqual(["Duna: Parte Dois"]);
    expect(callsTo("/discover/movie")[0].params).toMatchObject({ with_genres: 27, sort_by: "popularity.desc" });
    expect(callsTo("/discover/movie")[0].params["vote_average.gte"]).toBeUndefined();
  });

  it("fileira de gênero com nota mínima", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([]) });
    await getGenreRow(28, 8);
    expect(callsTo("/discover/movie")[0].params).toMatchObject({
      with_genres: 28,
      "vote_average.gte": 8,
      "vote_count.gte": 200,
      sort_by: "popularity.desc",
    });
  });

  it("fileiras com nota mínima seguem a ordem da Início e as vazias ou com falha somem", async () => {
    route({
      ...optionsRoute,
      "/discover/movie": (params) => {
        if (params.with_genres === 35) return paged([]); // Comédia: nenhum filme com essa nota
        if (params.with_genres === 18) return new TmdbError(500, "falhou"); // Drama: erro
        return paged([{ ...duna, id: Number(params.with_genres) }]);
      },
    });
    const rows = await getRatedGenreRows(8);
    expect(rows.map((r) => r.genre.name)).toEqual([
      "Ação",
      "Terror",
      "Ficção científica",
      "Romance",
      "Animação",
      "Suspense",
      "Crime",
      "Aventura",
    ]);
    expect(rows[0].movies.map((m) => m.id)).toEqual([28]);
    expect(callsTo("/discover/movie").every((c) => c.params["vote_average.gte"] === 8)).toBe(true);
  });

  it("fileiras com nota mínima: se todas falham, o erro sobe", async () => {
    route({ ...optionsRoute, "/discover/movie": () => new TmdbError(500, "falhou") });
    await expect(getRatedGenreRows(8)).rejects.toThrow("falhou");
  });

  it("destaques são os populares com imagem de fundo, com detalhes e posição no ranking", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([semPoster, duna]), "/movie/693134": () => dunaDetails });
    const featured = await getFeatured();
    expect(featured).toHaveLength(1);
    expect(featured[0]).toMatchObject({ id: 693134, rank: 2, runtime: 166, genres: ["Ficção científica", "Aventura"] });
  });

  it("sem imagem de fundo não há destaque", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([semPoster]) });
    expect(await getFeatured()).toEqual([]);
  });

  it("destaque cujos detalhes falham é pulado", async () => {
    route({ ...optionsRoute, "/discover/movie": () => paged([duna]), "/movie/693134": () => new TmdbError(500, "falhou") });
    expect(await getFeatured()).toEqual([]);
  });
});

describe("searchMovies", () => {
  it("texto vazio não chama a API", async () => {
    route({});
    expect(await searchMovies("   ")).toEqual({ items: [], page: 0, totalPages: 0 });
    expect(calls).toHaveLength(0);
  });

  it("mostra só filmes disponíveis por assinatura", async () => {
    route({ "/search/movie": () => paged([duna, semPoster]), "/movie/693134/watch/providers": () => providersBr(netflix) });
    const result = await searchMovies("  duna ");
    expect(result.items.map((m) => m.id)).toEqual([693134]);
    expect(callsTo("/search/movie")[0].params).toMatchObject({ query: "duna", region: "BR", page: 1 });
  });

  it("procura na página seguinte quando a primeira não tem nada disponível", async () => {
    route({
      "/search/movie": (p) => (p.page === 1 ? paged([semPoster], 1, 5) : paged([duna], 2, 5)),
      "/movie/693134/watch/providers": () => providersBr(netflix),
    });
    const result = await searchMovies("duna");
    expect(result).toMatchObject({ page: 2, totalPages: 5 });
    expect(result.items.map((m) => m.id)).toEqual([693134]);
  });

  it("desiste após 3 páginas sem nada disponível", async () => {
    route({ "/search/movie": (p) => paged([semPoster], Number(p.page), 10) });
    expect(await searchMovies("raro")).toEqual({ items: [], page: 3, totalPages: 10 });
    expect(callsTo("/search/movie")).toHaveLength(3);
  });

  it("para na última página", async () => {
    route({ "/search/movie": () => paged([semPoster], 1, 1) });
    expect(await searchMovies("raro")).toEqual({ items: [], page: 1, totalPages: 1 });
    expect(callsTo("/search/movie")).toHaveLength(1);
  });

  it("continua de onde parou", async () => {
    route({ "/search/movie": (p) => paged([semPoster], Number(p.page), 10) });
    expect((await searchMovies("raro", 4)).page).toBe(6);
    expect(callsTo("/search/movie").map((c) => c.params.page)).toEqual([4, 5, 6]);
  });
});

describe("getMovieDetails", () => {
  it("busca filme, vídeos e streamings numa consulta só", async () => {
    route({ "/movie/693134": () => dunaDetails });
    expect(await getMovieDetails(693134)).toMatchObject({ id: 693134, runtime: 166, trailer: { key: "pt1" } });
    const [call] = callsTo("/movie/693134");
    expect(call.params).toMatchObject({ append_to_response: "videos,watch/providers", include_video_language: "pt,en" });
    expect(call.revalidate).toBe(REVALIDATE.long);
  });

  it("404 vira null", async () => {
    route({});
    expect(await getMovieDetails(42)).toBeNull();
  });

  it("outros erros sobem", async () => {
    route({ "/movie/42": () => new TmdbError(500, "fora do ar") });
    await expect(getMovieDetails(42)).rejects.toThrow("fora do ar");
  });
});

import { describe, expect, it } from "vitest";
import { duna, dunaDetails, netflix, prime, providersBr, semPoster } from "@/test/fixtures/tmdb";
import { dedupeServices, mapBrFlatrate, mapMovie, mapMovieDetails, serviceName, toYear } from "./mappers";

describe("toYear", () => {
  it("extrai o ano da data", () => {
    expect(toYear("2024-02-27")).toBe(2024);
  });
  it("data vazia ou ausente → null", () => {
    expect(toYear("")).toBeNull();
    expect(toYear(undefined)).toBeNull();
  });
});

describe("mapBrFlatrate", () => {
  it("pega só as assinaturas do Brasil", () => {
    expect(mapBrFlatrate(providersBr(netflix))).toEqual([{ id: 8, name: "Netflix", logoPath: "/netflix.jpg" }]);
  });
  it("sem Brasil ou sem resposta → lista vazia", () => {
    expect(mapBrFlatrate({ results: { US: { flatrate: [netflix] } } })).toEqual([]);
    expect(mapBrFlatrate(undefined)).toEqual([]);
  });
});

describe("serviceName e dedupeServices", () => {
  const p = (id: number, name: string) => ({ id, name, logoPath: null });

  it("tira o plano ou o canal do nome", () => {
    expect(serviceName("Amazon Prime Video with Ads")).toBe("Amazon Prime Video");
    expect(serviceName("Paramount Plus Premium")).toBe("Paramount Plus");
    expect(serviceName("Apple TV Amazon Channel")).toBe("Apple TV");
    expect(serviceName("Netflix")).toBe("Netflix");
  });

  it("fica um logo por serviço e prefere o serviço principal", () => {
    const list = [p(1, "Apple TV Amazon Channel"), p(2, "Apple TV"), p(3, "Amazon Prime Video with Ads"), p(4, "Amazon Prime Video")];
    expect(dedupeServices(list).map((x) => x.id)).toEqual([2, 4]);
  });

  it("variante sem o serviço principal na lista continua aparecendo, uma vez só", () => {
    const list = [p(1, "Paramount Plus Premium"), p(2, "Paramount Plus Amazon Channel"), p(3, "Netflix")];
    expect(dedupeServices(list).map((x) => x.id)).toEqual([1, 3]);
  });
});

describe("mapMovie", () => {
  it("traduz para o formato do app", () => {
    const providers = [{ id: 8, name: "Netflix", logoPath: "/netflix.jpg" }];
    expect(mapMovie(duna, providers)).toEqual({
      id: 693134,
      title: "Duna: Parte Dois",
      year: 2024,
      rating: 8.15,
      posterPath: "/duna.jpg",
      backdropPath: "/duna-bg.jpg",
      providers,
    });
  });
  it("aguenta campos ausentes", () => {
    expect(mapMovie(semPoster)).toEqual({
      id: 1, title: "Filme Raro", year: null, rating: 0, posterPath: null, backdropPath: null, providers: [],
    });
  });
});

describe("mapMovieDetails", () => {
  it("junta detalhes, streamings e trailer", () => {
    const d = mapMovieDetails(dunaDetails);
    expect(d.runtime).toBe(166);
    expect(d.genres).toEqual(["Ficção científica", "Aventura"]);
    expect(d.overview).toBe("Paul Atreides se une a Chani e aos Fremen.");
    expect(d.trailer).toEqual({ key: "pt1", name: "Trailer" });
    expect(d.providers).toEqual([{ id: prime.provider_id, name: "Amazon Prime Video", logoPath: "/prime.jpg" }]);
  });
  it("duração zero, sinopse em branco, sem vídeos e sem streamings", () => {
    const d = mapMovieDetails({ ...semPoster, runtime: 0, overview: "   " });
    expect(d).toMatchObject({ runtime: null, overview: "", genres: [], trailer: null, providers: [] });
  });
});

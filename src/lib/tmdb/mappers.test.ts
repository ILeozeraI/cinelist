import { describe, expect, it } from "vitest";
import { duna, dunaDetails, netflix, prime, providersBr, semPoster } from "@/test/fixtures/tmdb";
import { mapBrFlatrate, mapMovie, mapMovieDetails, toYear } from "./mappers";

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
    expect(d.overview).toBe("Paul Atreides se une a Chani e aos Fremen.");
    expect(d.trailer).toEqual({ key: "pt1", name: "Trailer" });
    expect(d.providers).toEqual([{ id: prime.provider_id, name: "Amazon Prime Video", logoPath: "/prime.jpg" }]);
  });
  it("duração zero, sinopse em branco, sem vídeos e sem streamings", () => {
    const d = mapMovieDetails({ ...semPoster, runtime: 0, overview: "   " });
    expect(d).toMatchObject({ runtime: null, overview: "", trailer: null, providers: [] });
  });
});

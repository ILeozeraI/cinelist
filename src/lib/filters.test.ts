import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, parseFilters, parseMovieId, parsePage, serializeFilters } from "./filters";
import type { DiscoverFilters } from "./tmdb/types";

const YEAR = 2026;

describe("parseFilters", () => {
  it("sem parâmetros usa o padrão", () => {
    expect(parseFilters({}, YEAR)).toEqual(DEFAULT_FILTERS);
  });

  it("lê todos os campos", () => {
    expect(
      parseFilters({ streaming: "8,119", genero: "27", de: "2000", ate: "2024", nota: "6.5", ordem: "nota" }, YEAR),
    ).toEqual({ providerIds: [8, 119], genreId: 27, yearFrom: 2000, yearTo: 2024, minRating: 6.5, sort: "nota" });
  });

  it("descarta valores inválidos", () => {
    expect(
      parseFilters({ streaming: "abc,8,-3,8", genero: "999", de: "1800", ate: "3000", nota: "9.7", ordem: "aleatorio" }, YEAR),
    ).toEqual({ ...DEFAULT_FILTERS, providerIds: [8] });
  });

  it("troca 'de' e 'até' quando vêm invertidos", () => {
    expect(parseFilters({ de: "2024", ate: "2000" }, YEAR)).toMatchObject({ yearFrom: 2000, yearTo: 2024 });
  });

  it("aceita o ano seguinte ao atual (lançamentos)", () => {
    expect(parseFilters({ ate: "2027" }, YEAR).yearTo).toBe(2027);
    expect(parseFilters({ ate: "2028" }, YEAR).yearTo).toBeNull();
  });

  it("usa o primeiro valor quando o parâmetro se repete", () => {
    expect(parseFilters({ genero: ["35", "27"] }, YEAR).genreId).toBe(35);
  });

  it("nota fora do passo de 0,5 ou zero é ignorada", () => {
    expect(parseFilters({ nota: "6.3" }, YEAR).minRating).toBeNull();
    expect(parseFilters({ nota: "0" }, YEAR).minRating).toBeNull();
    expect(parseFilters({ nota: "7" }, YEAR).minRating).toBe(7);
  });
});

describe("serializeFilters", () => {
  const full: DiscoverFilters = { providerIds: [8, 119], genreId: 27, yearFrom: 2000, yearTo: 2024, minRating: 6.5, sort: "nota" };

  it("omite o que está no padrão", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
  });

  it("gera os parâmetros sempre na mesma ordem", () => {
    expect(serializeFilters(full)).toBe("streaming=8%2C119&genero=27&de=2000&ate=2024&nota=6.5&ordem=nota");
  });

  it("ida e volta preserva os filtros", () => {
    const back = parseFilters(Object.fromEntries(new URLSearchParams(serializeFilters(full))), YEAR);
    expect(back).toEqual(full);
  });
});

describe("parseMovieId", () => {
  it("aceita só inteiros positivos", () => {
    expect(parseMovieId("693134")).toBe(693134);
    expect(parseMovieId("abc")).toBeNull();
    expect(parseMovieId("0")).toBeNull();
    expect(parseMovieId("-5")).toBeNull();
    expect(parseMovieId("12.5")).toBeNull();
  });
});

describe("parsePage", () => {
  it("aceita inteiros de 1 a 500", () => {
    expect(parsePage(2)).toBe(2);
    expect(parsePage(500)).toBe(500);
    expect(parsePage(0)).toBeNull();
    expect(parsePage(501)).toBeNull();
    expect(parsePage(1.5)).toBeNull();
    expect(parsePage("2")).toBeNull();
  });
});

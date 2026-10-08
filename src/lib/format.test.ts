import { describe, expect, it } from "vitest";
import { formatRating, formatRuntime, tmdbImage } from "./format";

describe("formatRuntime", () => {
  it("formata horas e minutos", () => {
    expect(formatRuntime(166)).toBe("2h 46min");
  });
  it("omite minutos zerados", () => {
    expect(formatRuntime(120)).toBe("2h");
  });
  it("mostra só minutos abaixo de 1 hora", () => {
    expect(formatRuntime(45)).toBe("45min");
  });
  it("retorna null para duração ausente ou zero", () => {
    expect(formatRuntime(0)).toBeNull();
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("formatRating", () => {
  it("usa uma casa decimal", () => {
    expect(formatRating(8.237)).toBe("8.2");
    expect(formatRating(7)).toBe("7.0");
  });
});

describe("tmdbImage", () => {
  it("monta a URL da imagem no tamanho pedido", () => {
    expect(tmdbImage("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });
  it("retorna null sem caminho", () => {
    expect(tmdbImage(null, "w342")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { ALL_GENRES, HOME_GENRES } from "./genres";

describe("gêneros", () => {
  it("a Início tem os 10 gêneros na ordem combinada", () => {
    expect(HOME_GENRES.map((g) => g.id)).toEqual([28, 35, 18, 27, 878, 10749, 16, 53, 80, 12]);
    expect(HOME_GENRES.map((g) => g.name)).toEqual([
      "Ação", "Comédia", "Drama", "Terror", "Ficção científica",
      "Romance", "Animação", "Suspense", "Crime", "Aventura",
    ]);
  });

  it("a lista completa tem 19 gêneros sem repetição e inclui os da Início", () => {
    const ids = ALL_GENRES.map((g) => g.id);
    expect(ids).toHaveLength(19);
    expect(new Set(ids).size).toBe(19);
    for (const g of HOME_GENRES) expect(ALL_GENRES).toContainEqual(g);
  });
});

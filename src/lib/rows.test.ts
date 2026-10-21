import { describe, expect, it } from "vitest";
import { dedupeMovieRows } from "./rows";

describe("dedupeMovieRows", () => {
  it("o filme fica só na primeira fileira em que aparece", () => {
    const rows = dedupeMovieRows([
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }, { id: 3 }],
      [{ id: 1 }, { id: 3 }, { id: 4 }],
    ]);
    expect(rows).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }], [{ id: 4 }]]);
  });

  it("mantém a ordem dos filmes e das fileiras, mesmo as que ficam vazias", () => {
    expect(dedupeMovieRows([[{ id: 5 }], [{ id: 5 }], []])).toEqual([[{ id: 5 }], [], []]);
  });

  it("lista vazia continua vazia", () => {
    expect(dedupeMovieRows([])).toEqual([]);
  });
});

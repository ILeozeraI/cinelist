import { beforeEach, describe, expect, it, vi } from "vitest";
import { tmdbFetch } from "@/lib/tmdb/client";
import { duna, paged } from "@/test/fixtures/tmdb";
import { loadRatedGenreRows } from "./actions";

vi.mock("@/lib/tmdb/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tmdb/client")>()),
  tmdbFetch: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(tmdbFetch).mockReset();
  vi.mocked(tmdbFetch).mockImplementation((async (path: string) => {
    if (path === "/watch/providers/movie") return { results: [] };
    if (path === "/discover/movie") return paged([duna]);
    return { results: {} };
  }) as typeof tmdbFetch);
});

describe("loadRatedGenreRows", () => {
  it("busca as fileiras com a nota pedida", async () => {
    const rows = await loadRatedGenreRows(8);
    expect(rows[0]).toMatchObject({ genre: { id: 28, name: "Ação" }, movies: [{ id: 693134 }] });
    const discover = vi.mocked(tmdbFetch).mock.calls.filter(([path]) => path === "/discover/movie");
    expect(discover).toHaveLength(10);
    expect(discover.every(([, params]) => params?.["vote_average.gte"] === 8)).toBe(true);
  });

  it.each([7.5, 10, 0, "8", null])("recusa nota fora dos botões (%s) sem chamar o TMDB", async (rating) => {
    await expect(loadRatedGenreRows(rating as number)).rejects.toThrow("Nota inválida");
    expect(tmdbFetch).not.toHaveBeenCalled();
  });
});

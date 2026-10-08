import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildUrl, MAX_CONCURRENT, REVALIDATE, retryDelayMs, TmdbError, tmdbFetch } from "./client";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

beforeEach(() => {
  vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "token-teste");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buildUrl", () => {
  it("codifica acentos e & na busca", () => {
    const url = buildUrl("/search/movie", { query: "Pânico & Cia" });
    expect(new URL(url).searchParams.get("query")).toBe("Pânico & Cia");
    expect(url).toContain("query=P%C3%A2nico+%26+Cia");
  });
});

describe("tmdbFetch", () => {
  it("envia o token, pt-BR, os parâmetros e o tempo de cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(tmdbFetch("/discover/movie", { page: 2, with_genres: undefined })).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://api.themoviedb.org/3/discover/movie");
    expect(u.searchParams.get("language")).toBe("pt-BR");
    expect(u.searchParams.get("page")).toBe("2");
    expect(u.searchParams.has("with_genres")).toBe(false);
    expect(init.headers.Authorization).toBe("Bearer token-teste");
    expect(init.next).toEqual({ revalidate: REVALIDATE.short });
  });

  it("usa o tempo de cache informado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({}));
    vi.stubGlobal("fetch", fetchMock);
    await tmdbFetch("/movie/1", {}, REVALIDATE.long);
    expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 86400 });
  });

  it("explica o que fazer quando falta o token", async () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "");
    vi.stubGlobal("fetch", vi.fn());
    await expect(tmdbFetch("/x")).rejects.toThrow("Defina TMDB_API_READ_ACCESS_TOKEN no .env.local");
  });

  it("404 vira TmdbError sem nova tentativa", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({}, 404));
    vi.stubGlobal("fetch", fetchMock);
    await expect(tmdbFetch("/movie/999")).rejects.toMatchObject({ name: "TmdbError", status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429 tenta de novo uma vez, respeitando Retry-After", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({}, 429, { "retry-after": "1" }))
      .mockResolvedValueOnce(json({ ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(tmdbFetch("/x")).resolves.toEqual({ ok: 1 });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("5xx duas vezes seguidas vira TmdbError", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(json({}, 500));
    vi.stubGlobal("fetch", fetchMock);

    const assertion = expect(tmdbFetch("/x")).rejects.toBeInstanceOf(TmdbError);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it(`faz no máximo ${MAX_CONCURRENT} pedidos ao mesmo tempo`, async () => {
    let active = 0;
    let peak = 0;
    const fetchMock = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return json({});
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all(Array.from({ length: 25 }, (_, i) => tmdbFetch(`/x/${i}`)));
    expect(peak).toBe(MAX_CONCURRENT);
    expect(fetchMock).toHaveBeenCalledTimes(25);
  });
});

describe("retryDelayMs", () => {
  it("usa Retry-After em segundos, limitado a 5 s, ou 500 ms por padrão", () => {
    expect(retryDelayMs("2")).toBe(2000);
    expect(retryDelayMs("60")).toBe(5000);
    expect(retryDelayMs(null)).toBe(500);
    expect(retryDelayMs("abc")).toBe(500);
  });
});

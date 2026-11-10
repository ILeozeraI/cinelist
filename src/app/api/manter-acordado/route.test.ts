import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { select, from, rpc, createClient } = vi.hoisted(() => {
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));
  const rpc = vi.fn();
  return { select, from, rpc, createClient: vi.fn(() => ({ from, rpc })) };
});
vi.mock("@supabase/supabase-js", () => ({ createClient }));

import { GET } from "./route";

function req(auth?: string) {
  return new Request("http://localhost/api/manter-acordado", { headers: auth ? { authorization: auth } : {} });
}

describe("GET /api/manter-acordado", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3gr3do");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    select.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: "2026-11-10T12:00:00Z", error: null });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("recusa sem o segredo", async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req("Bearer errado"))).status).toBe(401);
    expect((await GET(req("Bearer "))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(req("Bearer "))).status).toBe(401);
    expect((await GET(req("Bearer s3gr3do"))).status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("grava a batida no banco e faz uma leitura com o segredo certo", async () => {
    const res = await GET(req("Bearer s3gr3do"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    // Escrita de verdade: uma consulta só de contagem (HEAD) não bastou para o Supabase.
    expect(rpc).toHaveBeenCalledWith("manter_acordado");
    expect(from).toHaveBeenCalledWith("movie_marks");
    expect(select).toHaveBeenCalledWith("movie_id", { count: "exact", head: true });
  });

  it("avisa quando o Supabase falha", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    select.mockResolvedValue({ error: { message: "boom" } });
    const res = await GET(req("Bearer s3gr3do"));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
    expect(spy).toHaveBeenCalled();

    spy.mockClear();
    select.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: null, error: { message: "function manter_acordado does not exist" } });
    const semFuncao = await GET(req("Bearer s3gr3do"));
    expect(semFuncao.status).toBe(503);
    expect(spy).toHaveBeenCalled();

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await GET(req("Bearer s3gr3do"))).status).toBe(503);
  });
});

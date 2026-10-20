import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
const createServerClient = vi.fn((..._args: unknown[]) => ({ auth: { getClaims } })); // eslint-disable-line @typescript-eslint/no-unused-vars
vi.mock("@supabase/ssr", () => ({ createServerClient: (...a: unknown[]) => createServerClient(...a) }));

import { SUPABASE_TIMEOUT_MS, supabaseFetch } from "./env";
import { updateSession } from "./session";

const req = (cookie?: string) =>
  new NextRequest("http://localhost/", { headers: cookie ? { cookie } : {} });

describe("updateSession", () => {
  beforeEach(() => {
    getClaims.mockReset().mockResolvedValue({ data: null, error: null });
    createServerClient.mockClear();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("não chama o Supabase quando não há cookie sb-", async () => {
    const res = await updateSession(req());
    expect(res.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("não chama o Supabase sem variáveis", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    await updateSession(req("sb-x-auth-token=abc"));
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("renova a sessão quando há cookie sb-", async () => {
    await updateSession(req("sb-x-auth-token=abc"));
    expect(createServerClient).toHaveBeenCalledTimes(1);
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it("segue a navegação se o Supabase falhar", async () => {
    getClaims.mockRejectedValue(new Error("fora do ar"));
    const res = await updateSession(req("sb-x-auth-token=abc"));
    expect(res.status).toBe(200);
  });

  it("usa o fetch com tempo limite", async () => {
    await updateSession(req("sb-x-auth-token=abc"));
    expect(createServerClient.mock.calls[0][2]).toMatchObject({ global: { fetch: supabaseFetch } });
  });

  it("segue a navegação se o Supabase não responder a tempo", async () => {
    vi.useFakeTimers();
    getClaims.mockReturnValue(new Promise(() => {}));
    let res: Response | undefined;
    void updateSession(req("sb-x-auth-token=abc")).then((r) => (res = r));
    await vi.advanceTimersByTimeAsync(SUPABASE_TIMEOUT_MS);
    expect(res?.status).toBe(200);
    expect(res?.headers.get("x-middleware-next")).toBe("1");
  });

  it("repassa os cabeçalhos anticache junto com os cookies", async () => {
    getClaims.mockImplementation(async () => {
      const options = createServerClient.mock.calls[0][2] as {
        cookies: { setAll: (c: { name: string; value: string; options: object }[], h: Record<string, string>) => void };
      };
      options.cookies.setAll([{ name: "sb-x-auth-token", value: "novo", options: {} }], {
        "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
        Expires: "0",
        Pragma: "no-cache",
      });
      return { data: null, error: null };
    });
    const res = await updateSession(req("sb-x-auth-token=abc"));
    expect(res.headers.get("Cache-Control")).toBe("private, no-cache, no-store, must-revalidate, max-age=0");
    expect(res.headers.get("Pragma")).toBe("no-cache");
    expect(res.cookies.get("sb-x-auth-token")?.value).toBe("novo");
  });
});

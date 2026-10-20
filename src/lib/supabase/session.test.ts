import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
const createServerClient = vi.fn((..._args: unknown[]) => ({ auth: { getClaims } })); // eslint-disable-line @typescript-eslint/no-unused-vars
vi.mock("@supabase/ssr", () => ({ createServerClient: (...a: unknown[]) => createServerClient(...a) }));

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
  afterEach(() => vi.unstubAllEnvs());

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
});

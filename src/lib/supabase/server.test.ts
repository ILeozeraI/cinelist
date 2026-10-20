import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthApiError, AuthInvalidJwtError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const createServerClient = vi.fn((..._args: unknown[]) => ({})); // eslint-disable-line @typescript-eslint/no-unused-vars
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: (...a: unknown[]) => createServerClient(...a) }));

import { SUPABASE_TIMEOUT_MS, supabaseFetch } from "./env";
import { createSupabaseServerClient, getCurrentUserId } from "./server";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("createSupabaseServerClient", () => {
  it("usa o fetch com tempo limite", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    await createSupabaseServerClient();
    expect(createServerClient.mock.calls[0][2]).toMatchObject({ global: { fetch: supabaseFetch } });
  });
});

const fakeClient = (result: unknown) =>
  ({ auth: { getClaims: vi.fn().mockResolvedValue(result) } }) as unknown as SupabaseClient;

describe("getCurrentUserId", () => {
  it("devolve null sem sessão", async () => {
    expect(await getCurrentUserId(fakeClient({ data: null, error: null }))).toBeNull();
  });

  it("devolve o sub das claims", async () => {
    const c = fakeClient({ data: { claims: { sub: "user-1" } }, error: null });
    expect(await getCurrentUserId(c)).toBe("user-1");
  });

  it.each([
    ["JWT inválido", new AuthInvalidJwtError("jwt ruim")],
    ["erro 400 da API", new AuthApiError("refresh token inválido", 400, "refresh_token_not_found")],
  ])("trata %s como anônimo", async (_nome, error) => {
    expect(await getCurrentUserId(fakeClient({ data: null, error }))).toBeNull();
  });

  it.each([
    ["falha de rede", new AuthRetryableFetchError("rede", 0)],
    ["status 0", new AuthApiError("sem resposta", 0, undefined)],
    ["status 500", new AuthApiError("erro interno", 500, undefined)],
  ])("relança %s", async (_nome, error) => {
    await expect(getCurrentUserId(fakeClient({ data: null, error }))).rejects.toBe(error);
  });

  it("relança se o Supabase não responder a tempo", async () => {
    vi.useFakeTimers();
    const c = { auth: { getClaims: vi.fn(() => new Promise(() => {})) } } as unknown as SupabaseClient;
    const result = expect(getCurrentUserId(c)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(SUPABASE_TIMEOUT_MS);
    await result;
  });
});

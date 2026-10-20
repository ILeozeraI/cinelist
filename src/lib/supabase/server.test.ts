import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthApiError, AuthInvalidJwtError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { getCurrentUserId } from "./server";

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
});

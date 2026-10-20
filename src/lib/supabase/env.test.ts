import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("getSupabaseEnv", () => {
  it("devolve url e chave quando as duas existem", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");
    expect(getSupabaseEnv()).toEqual({ url: "https://x.supabase.co", key: "sb_publishable_abc" });
  });

  it.each([
    ["", "k"],
    ["https://x.supabase.co", ""],
    [undefined, undefined],
  ])("devolve null sem variável (%s, %s)", (url, key) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
    expect(getSupabaseEnv()).toBeNull();
  });
});

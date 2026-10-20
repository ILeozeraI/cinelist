import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv, supabaseFetch, withTimeout } from "./env";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

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

describe("supabaseFetch", () => {
  it("põe um tempo limite e respeita o sinal de quem chamou", async () => {
    const fetchSpy = vi.fn(async (..._args: unknown[]) => new Response("ok")); // eslint-disable-line @typescript-eslint/no-unused-vars
    vi.stubGlobal("fetch", fetchSpy);
    const caller = new AbortController();
    await supabaseFetch("https://x.supabase.co/auth/v1/token", { method: "POST", signal: caller.signal });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);
    caller.abort();
    expect(init.signal?.aborted).toBe(true);
  });
});

describe("withTimeout", () => {
  it("rejeita quando a promessa passa do tempo", async () => {
    vi.useFakeTimers();
    const result = expect(withTimeout(new Promise(() => {}), 3000)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(3000);
    await result;
  });

  it("devolve o valor quando chega a tempo", async () => {
    await expect(withTimeout(Promise.resolve(7), 3000)).resolves.toBe(7);
  });
});

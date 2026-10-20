import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMarkStatus, listMarkedMovieIds, saveMark } from "./marks";

// Cliente falso: registra as chamadas encadeadas e resolve com `result` ao final.
function fakeClient(result: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const calls: [string, unknown[]][] = [];
  const chain: Record<string, unknown> = {};
  for (const name of ["from", "select", "upsert", "delete", "eq", "order"]) {
    chain[name] = vi.fn((...args: unknown[]) => {
      calls.push([name, args]);
      return chain;
    });
  }
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return { client: chain as unknown as SupabaseClient, calls };
}

describe("saveMark", () => {
  it("saveMark com estado faz upsert com updated_at", async () => {
    const { client, calls } = fakeClient();
    await saveMark(client, "u1", 7, "ja_assisti");
    expect(calls[0]).toEqual(["from", ["movie_marks"]]);
    const [name, args] = calls[1];
    expect(name).toBe("upsert");
    expect(args[0]).toMatchObject({ user_id: "u1", movie_id: 7, status: "ja_assisti" });
    expect(typeof (args[0] as { updated_at: unknown }).updated_at).toBe("string");
    expect(args[1]).toEqual({ onConflict: "user_id,movie_id" });
  });

  it("saveMark com null apaga", async () => {
    const { client, calls } = fakeClient();
    await saveMark(client, "u1", 7, null);
    expect(calls.map(([n]) => n)).toEqual(["from", "delete", "eq", "eq"]);
    expect(calls.filter(([n]) => n === "eq").map(([, a]) => a)).toEqual([["user_id", "u1"], ["movie_id", 7]]);
  });

  it("lança erro se o Supabase devolver error", async () => {
    const { client } = fakeClient({ error: new Error("falhou") });
    await expect(saveMark(client, "u1", 7, "quero_assistir")).rejects.toThrow("falhou");
  });
});

describe("listMarkedMovieIds", () => {
  it("ordena do mais recente", async () => {
    const { client, calls } = fakeClient({ data: [{ movie_id: 3 }, { movie_id: 1 }], error: null });
    await expect(listMarkedMovieIds(client, "u1", "quero_assistir")).resolves.toEqual([3, 1]);
    expect(calls).toContainEqual(["eq", ["status", "quero_assistir"]]);
    expect(calls).toContainEqual(["order", ["updated_at", { ascending: false }]]);
  });
});

describe("isMarkStatus", () => {
  it("aceita os dois valores e recusa o resto", () => {
    expect(isMarkStatus("quero_assistir")).toBe(true);
    expect(isMarkStatus("ja_assisti")).toBe(true);
    expect(isMarkStatus("assistido")).toBe(false);
    expect(isMarkStatus(null)).toBe(false);
    expect(isMarkStatus(1)).toBe(false);
  });
});

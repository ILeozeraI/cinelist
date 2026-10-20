import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getMark, saveMark } from "@/lib/marks";
import { createSupabaseServerClient, getCurrentUserId } from "@/lib/supabase/server";
import { loadMark, setMark } from "./mark-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn(), getCurrentUserId: vi.fn() }));
vi.mock("@/lib/marks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/marks")>()),
  getMark: vi.fn(),
  saveMark: vi.fn(),
}));

const client = {} as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(createSupabaseServerClient).mockResolvedValue(client);
  vi.mocked(getCurrentUserId).mockResolvedValue("u1");
});

describe("validação", () => {
  it.each([0, -1, 1.5, "12", null, Number.MAX_SAFE_INTEGER + 1])("recusa id inválido (%s) sem chamar o Supabase", async (id) => {
    await expect(loadMark(id as number)).rejects.toThrow("Filme inválido");
    await expect(setMark(id as number, "ja_assisti")).rejects.toThrow("Filme inválido");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("setMark recusa estado desconhecido", async () => {
    await expect(setMark(7, "assistido" as never)).rejects.toThrow("Estado inválido");
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });
});

describe("loadMark", () => {
  it("devolve o estado salvo", async () => {
    vi.mocked(getMark).mockResolvedValue("quero_assistir");
    await expect(loadMark(7)).resolves.toEqual({ state: "ok", status: "quero_assistir" });
    expect(getMark).toHaveBeenCalledWith(client, "u1", 7);
  });

  it("sem sessão devolve anonimo", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);
    await expect(loadMark(7)).resolves.toEqual({ state: "anonimo" });
  });

  it.each([
    ["cliente nulo", () => vi.mocked(createSupabaseServerClient).mockResolvedValue(null)],
    ["getCurrentUserId rejeita", () => vi.mocked(getCurrentUserId).mockRejectedValue(new Error("fora"))],
    ["getMark rejeita", () => vi.mocked(getMark).mockRejectedValue(new Error("fora"))],
  ])("Supabase fora do ar devolve indisponivel (%s)", async (_nome, quebrar) => {
    quebrar();
    await expect(loadMark(7)).resolves.toEqual({ state: "indisponivel" });
  });
});

describe("setMark", () => {
  it("sem sessão devolve anonimo", async () => {
    vi.mocked(getCurrentUserId).mockResolvedValue(null);
    await expect(setMark(7, "ja_assisti")).resolves.toEqual({ state: "anonimo" });
    expect(saveMark).not.toHaveBeenCalled();
  });

  it.each([
    ["cliente nulo", () => vi.mocked(createSupabaseServerClient).mockResolvedValue(null)],
    ["getCurrentUserId rejeita", () => vi.mocked(getCurrentUserId).mockRejectedValue(new Error("fora"))],
    ["saveMark rejeita", () => vi.mocked(saveMark).mockRejectedValue(new Error("fora"))],
  ])("Supabase fora do ar devolve indisponivel (%s)", async (_nome, quebrar) => {
    quebrar();
    await expect(setMark(7, "ja_assisti")).resolves.toEqual({ state: "indisponivel" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("setMark salva e revalida as abas", async () => {
    vi.mocked(saveMark).mockResolvedValue(undefined);
    await expect(setMark(7, "ja_assisti")).resolves.toEqual({ state: "ok", status: "ja_assisti" });
    expect(saveMark).toHaveBeenCalledWith(client, "u1", 7, "ja_assisti");
    expect(revalidatePath).toHaveBeenCalledWith("/quero-assistir");
    expect(revalidatePath).toHaveBeenCalledWith("/ja-assisti");
  });

  it("null desmarca", async () => {
    vi.mocked(saveMark).mockResolvedValue(undefined);
    await expect(setMark(7, null)).resolves.toEqual({ state: "ok", status: null });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { UNAVAILABLE_MESSAGE } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signIn, signOut, signUp } from "./auth-actions";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};
const prev = { error: null, email: "" };

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

beforeEach(() => {
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth } as never);
  auth.signInWithPassword.mockReset().mockResolvedValue({ error: null });
  auth.signUp
    .mockReset()
    .mockResolvedValue({ data: { session: {} }, error: null });
  auth.signOut.mockReset().mockResolvedValue({ error: null });
});

describe("signIn", () => {
  it("com sucesso redireciona para o voltar seguro", async () => {
    await expect(
      signIn(
        prev,
        form({ email: "a@b.com", senha: "123456", voltar: "/filme/9" }),
      ),
    ).rejects.toThrow("REDIRECT:/filme/9");
    await expect(
      signIn(
        prev,
        form({ email: "a@b.com", senha: "123456", voltar: "//evil.com" }),
      ),
    ).rejects.toThrow("REDIRECT:/");
  });

  it("devolve a mensagem traduzida e mantém o e-mail", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials" },
    });
    expect(
      await signIn(prev, form({ email: "a@b.com", senha: "errada1" })),
    ).toEqual({
      error: "E-mail ou senha incorretos.",
      email: "a@b.com",
    });
  });

  it("apara espaços do e-mail", async () => {
    await expect(
      signIn(prev, form({ email: " A@B.com ", senha: "123456" })),
    ).rejects.toThrow("REDIRECT:/");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  it("recusa e-mail inválido e senha vazia sem chamar o Supabase", async () => {
    expect(
      (await signIn(prev, form({ email: "ab.com", senha: "123456" }))).error,
    ).toBe("Digite um e-mail válido.");
    expect(
      (await signIn(prev, form({ email: "a@b.com", senha: "" }))).error,
    ).toBeTruthy();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("recusa senha com mais de 72 caracteres sem chamar o Supabase", async () => {
    expect(
      await signIn(prev, form({ email: "a@b.com", senha: "x".repeat(73) })),
    ).toEqual({
      error: "A senha pode ter no máximo 72 caracteres.",
      email: "a@b.com",
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("registra código do Supabase sem tradução", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "codigo_novo", status: 422 },
    });
    expect(
      (await signIn(prev, form({ email: "a@b.com", senha: "123456" }))).error,
    ).toBe(UNAVAILABLE_MESSAGE);
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      "codigo_novo",
      422,
    );
    spy.mockRestore();
  });

  it("não registra código conhecido", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", status: 400 },
    });
    await signIn(prev, form({ email: "a@b.com", senha: "123456" }));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("trata falha de rede como indisponível", async () => {
    auth.signInWithPassword.mockRejectedValue(new Error("rede"));
    expect(
      await signIn(prev, form({ email: "a@b.com", senha: "123456" })),
    ).toEqual({ error: UNAVAILABLE_MESSAGE, email: "a@b.com" });
  });

  it("fica indisponível sem Supabase", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    expect(
      await signIn(prev, form({ email: "a@b.com", senha: "123456" })),
    ).toEqual({ error: UNAVAILABLE_MESSAGE, email: "a@b.com" });
  });
});

describe("signUp", () => {
  it("recusa senha curta sem chamar o Supabase", async () => {
    const result = await signUp(
      prev,
      form({ email: "a@b.com", senha: "12345" }),
    );
    expect(result).toEqual({
      error: "A senha precisa ter pelo menos 6 caracteres.",
      email: "a@b.com",
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("recusa senha com mais de 72 caracteres sem chamar o Supabase", async () => {
    const result = await signUp(
      prev,
      form({ email: "a@b.com", senha: "x".repeat(73) }),
    );
    expect(result.error).toBe("A senha pode ter no máximo 72 caracteres.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("aceita senha com exatamente 72 caracteres", async () => {
    await expect(
      signUp(prev, form({ email: "a@b.com", senha: "x".repeat(72) })),
    ).rejects.toThrow("REDIRECT:/");
    expect(auth.signUp).toHaveBeenCalled();
  });

  it("recusa e-mail sem @ sem chamar o Supabase", async () => {
    const result = await signUp(
      prev,
      form({ email: "ab.com", senha: "123456" }),
    );
    expect(result.error).toBe("Digite um e-mail válido.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("com sucesso redireciona", async () => {
    await expect(
      signUp(
        prev,
        form({
          email: " A@B.com ",
          senha: "123456",
          voltar: "/quero-assistir",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/quero-assistir");
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  it("sem sessão devolvida mostra erro e registra", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const result = await signUp(
      prev,
      form({ email: "a@b.com", senha: "123456" }),
    );
    expect(result.error).toBe(UNAVAILABLE_MESSAGE);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("traduz o erro do Supabase", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    auth.signUp.mockResolvedValue({
      data: { session: null },
      error: { code: "user_already_exists" },
    });
    expect(
      (await signUp(prev, form({ email: "a@b.com", senha: "123456" }))).error,
    ).toBe("Este e-mail já tem uma conta. Use a opção Entrar.");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("fica indisponível sem Supabase", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    expect(
      (await signUp(prev, form({ email: "a@b.com", senha: "123456" }))).error,
    ).toBe(UNAVAILABLE_MESSAGE);
  });
});

describe("signOut", () => {
  it("sai sem redirecionar, mesmo se a rede falhar", async () => {
    auth.signOut.mockRejectedValue(new Error("rede"));
    await expect(signOut()).resolves.toBeUndefined();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("sai só deste aparelho", async () => {
    await signOut();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});

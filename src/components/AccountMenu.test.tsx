import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signOut } from "@/app/auth-actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AccountMenu } from "./AccountMenu";

let pathname = "/filme/5";
const router = { refresh: vi.fn(), push: vi.fn() };

vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => router }));
vi.mock("@/lib/supabase/browser", () => ({ getSupabaseBrowserClient: vi.fn() }));
vi.mock("@/app/auth-actions", () => ({ signOut: vi.fn() }));

const reload = vi.fn();
const assign = vi.fn();
let search = "";

const getSession = vi.fn();
const unsubscribe = vi.fn();
const onAuthStateChange = vi.fn();

function withSession(email: string | null) {
  getSession.mockResolvedValue({ data: { session: email ? { user: { email } } : null } });
}

beforeEach(() => {
  pathname = "/filme/5";
  search = "";
  reload.mockReset();
  assign.mockReset();
  // O jsdom não deixa trocar reload/assign; o objeto location inteiro é substituído.
  vi.stubGlobal("location", {
    get pathname() {
      return pathname;
    },
    get search() {
      return search;
    },
    reload,
    assign,
  });
  router.refresh.mockReset();
  router.push.mockReset();
  getSession.mockReset();
  onAuthStateChange.mockReset().mockReturnValue({ data: { subscription: { unsubscribe } } });
  vi.mocked(signOut).mockReset().mockResolvedValue(undefined);
  vi.mocked(getSupabaseBrowserClient).mockReset().mockReturnValue({ auth: { getSession, onAuthStateChange } } as never);
  withSession(null);
});

afterEach(() => vi.unstubAllGlobals());

describe("AccountMenu", () => {
  it("sem sessão mostra Entrar com retorno para a página atual", async () => {
    render(<AccountMenu />);
    expect(await screen.findByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar?voltar=%2Ffilme%2F5");
  });

  it("com sessão mostra o e-mail e Sair", async () => {
    withSession("ana@ex.com");
    render(<AccountMenu />);
    const button = await screen.findByRole("button", { name: /ana@ex\.com/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("fecha o menu com Esc e com clique fora", async () => {
    withSession("ana@ex.com");
    render(<AccountMenu />);
    fireEvent.click(await screen.findByRole("button", { name: /ana@ex\.com/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /ana@ex\.com/ }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });

  it("Sair encerra a sessão e recarrega a página", async () => {
    withSession("ana@ex.com");
    render(<AccountMenu />);
    fireEvent.click(await screen.findByRole("button", { name: /ana@ex\.com/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(signOut).toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("Sair numa aba pessoal vai para a Início", async () => {
    pathname = "/ja-assisti";
    withSession("ana@ex.com");
    render(<AccountMenu />);
    fireEvent.click(await screen.findByRole("button", { name: /ana@ex\.com/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
    expect(reload).not.toHaveBeenCalled();
  });

  it("se o Sair falhar no caminho, o botão volta a funcionar", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("rede"));
    withSession("ana@ex.com");
    render(<AccountMenu />);
    fireEvent.click(await screen.findByRole("button", { name: /ana@ex\.com/ }));
    const sair = screen.getByRole("button", { name: "Sair" });
    fireEvent.click(sair);
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    await waitFor(() => expect(sair).toBeEnabled());
    expect(reload).not.toHaveBeenCalled();
  });

  it("Entrar guarda a busca atual no retorno", async () => {
    pathname = "/buscar";
    search = "?q=duna";
    render(<AccountMenu />);
    expect(await screen.findByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar?voltar=%2Fbuscar%3Fq%3Dduna");
  });

  it("na própria página de entrar não mostra o Entrar", async () => {
    pathname = "/entrar";
    search = "?voltar=%2Ffilme%2F5";
    render(<AccountMenu />);
    await waitFor(() => expect(getSession).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
  });

  it("sem Supabase mostra Entrar", async () => {
    vi.mocked(getSupabaseBrowserClient).mockReturnValue(null);
    render(<AccountMenu />);
    expect(await screen.findByRole("link", { name: "Entrar" })).toBeInTheDocument();
  });

  it("relê a sessão ao mudar de página", async () => {
    const { rerender } = render(<AccountMenu />);
    await screen.findByRole("link", { name: "Entrar" });
    expect(getSession).toHaveBeenCalledTimes(1);
    withSession("ana@ex.com");
    pathname = "/";
    await act(async () => rerender(<AccountMenu />));
    expect(getSession).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole("button", { name: /ana@ex\.com/ })).toBeInTheDocument();
  });
});

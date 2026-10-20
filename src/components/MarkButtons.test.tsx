import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadMark, setMark } from "@/app/mark-actions";
import type { MarkResult } from "@/app/mark-actions";
import { loginHref, UNAVAILABLE_MESSAGE } from "@/lib/auth";
import { MarkButtons } from "./MarkButtons";

const router = { push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/app/mark-actions", () => ({ loadMark: vi.fn(), setMark: vi.fn() }));

const ID = 42;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const ok = (status: "quero_assistir" | "ja_assisti" | null): MarkResult => ({ state: "ok", status });

function want() {
  return screen.getByRole("button", { name: "Quero assistir" });
}
function seen() {
  return screen.getByRole("button", { name: "Já assisti" });
}
async function ready() {
  await waitFor(() => expect(want()).not.toBeDisabled());
}

beforeEach(() => {
  router.push.mockReset();
  vi.mocked(loadMark).mockReset().mockResolvedValue(ok(null));
  vi.mocked(setMark).mockReset().mockResolvedValue(ok(null));
});

describe("MarkButtons", () => {
  it("mostra o estado salvo", async () => {
    vi.mocked(loadMark).mockResolvedValue(ok("quero_assistir"));
    render(<MarkButtons movieId={ID} />);
    await waitFor(() => expect(want()).toHaveAttribute("aria-pressed", "true"));
    expect(seen()).toHaveAttribute("aria-pressed", "false");
  });

  it("começa com os botões desabilitados enquanto carrega", async () => {
    const d = deferred<MarkResult>();
    vi.mocked(loadMark).mockReturnValue(d.promise);
    render(<MarkButtons movieId={ID} />);
    expect(want()).toBeDisabled();
    expect(seen()).toBeDisabled();
    d.resolve(ok(null));
    await ready();
  });

  it("marcar Já assisti troca na hora", async () => {
    vi.mocked(loadMark).mockResolvedValue(ok("quero_assistir"));
    const d = deferred<MarkResult>();
    vi.mocked(setMark).mockReturnValue(d.promise);
    render(<MarkButtons movieId={ID} />);
    await waitFor(() => expect(want()).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(seen());
    expect(seen()).toHaveAttribute("aria-pressed", "true");
    expect(want()).toHaveAttribute("aria-pressed", "false");
    expect(setMark).toHaveBeenCalledWith(ID, "ja_assisti");
    d.resolve(ok("ja_assisti"));
    await waitFor(() => expect(seen()).not.toBeDisabled());
    expect(seen()).toHaveAttribute("aria-pressed", "true");
  });

  it("clicar no marcado desmarca", async () => {
    vi.mocked(loadMark).mockResolvedValue(ok("ja_assisti"));
    render(<MarkButtons movieId={ID} />);
    await waitFor(() => expect(seen()).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(seen());
    expect(setMark).toHaveBeenCalledWith(ID, null);
    await waitFor(() => expect(seen()).not.toBeDisabled());
    expect(seen()).toHaveAttribute("aria-pressed", "false");
    expect(want()).toHaveAttribute("aria-pressed", "false");
  });

  it("volta ao estado anterior e avisa quando falha", async () => {
    vi.mocked(loadMark).mockResolvedValue(ok("quero_assistir"));
    vi.mocked(setMark).mockResolvedValue({ state: "indisponivel" });
    render(<MarkButtons movieId={ID} />);
    await waitFor(() => expect(want()).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(seen());
    expect(await screen.findByRole("alert")).toHaveTextContent(UNAVAILABLE_MESSAGE);
    expect(want()).toHaveAttribute("aria-pressed", "true");
    expect(seen()).toHaveAttribute("aria-pressed", "false");
  });

  it("trata erro de transporte como indisponível e libera os botões", async () => {
    vi.mocked(setMark).mockRejectedValue(new Error("rede"));
    render(<MarkButtons movieId={ID} />);
    await ready();
    fireEvent.click(seen());
    expect(await screen.findByRole("alert")).toHaveTextContent(UNAVAILABLE_MESSAGE);
    expect(seen()).not.toBeDisabled();
    expect(seen()).toHaveAttribute("aria-pressed", "false");
  });

  it("limpa o aviso no próximo clique", async () => {
    vi.mocked(setMark).mockResolvedValueOnce({ state: "indisponivel" }).mockResolvedValueOnce(ok("ja_assisti"));
    render(<MarkButtons movieId={ID} />);
    await ready();
    fireEvent.click(seen());
    await screen.findByRole("alert");
    fireEvent.click(seen());
    expect(screen.queryByRole("alert")).toBeNull();
    await waitFor(() => expect(seen()).not.toBeDisabled());
  });

  it("bloqueia novos cliques enquanto salva", async () => {
    const d = deferred<MarkResult>();
    vi.mocked(setMark).mockReturnValue(d.promise);
    render(<MarkButtons movieId={ID} />);
    await ready();
    fireEvent.click(seen());
    expect(want()).toBeDisabled();
    expect(seen()).toBeDisabled();
    fireEvent.click(want());
    fireEvent.click(seen());
    expect(setMark).toHaveBeenCalledTimes(1);
    d.resolve(ok("ja_assisti"));
    await waitFor(() => expect(seen()).not.toBeDisabled());
  });

  it("sem login vai para o Entrar", async () => {
    vi.mocked(loadMark).mockResolvedValue({ state: "anonimo" });
    render(<MarkButtons movieId={ID} />);
    await ready();
    fireEvent.click(want());
    expect(router.push).toHaveBeenCalledWith("/entrar?voltar=%2Ffilme%2F42");
    expect(setMark).not.toHaveBeenCalled();
  });

  it("vai para o login quando a sessão expirou", async () => {
    vi.mocked(setMark).mockResolvedValue({ state: "anonimo" });
    render(<MarkButtons movieId={ID} />);
    await ready();
    fireEvent.click(seen());
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(loginHref("/filme/42")));
    await waitFor(() => expect(seen()).not.toBeDisabled());
    expect(seen()).toHaveAttribute("aria-pressed", "false");
  });

  it("Supabase fora do ar ao carregar", async () => {
    vi.mocked(loadMark).mockResolvedValue({ state: "indisponivel" });
    vi.mocked(setMark).mockResolvedValue(ok("quero_assistir"));
    render(<MarkButtons movieId={ID} />);
    await ready();
    fireEvent.click(want());
    expect(setMark).toHaveBeenCalledWith(ID, "quero_assistir");
    await waitFor(() => expect(want()).toHaveAttribute("aria-pressed", "true"));
  });
});

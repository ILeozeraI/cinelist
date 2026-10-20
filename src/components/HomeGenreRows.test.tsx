import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadRatedGenreRows } from "@/app/actions";
import type { GenreRow } from "@/lib/tmdb/types";
import { makeMovie } from "@/test/fixtures/movies";
import { HomeGenreRows } from "./HomeGenreRows";

let search = "";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(search), usePathname: () => "/" }));
vi.mock("@/app/actions", () => ({ loadRatedGenreRows: vi.fn() }));

/** Resposta do servidor que o teste libera quando quiser. */
function deferred() {
  let resolve!: (rows: GenreRow[]) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<GenreRow[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const acao: GenreRow = { genre: { id: 28, name: "Ação" }, movies: [makeMovie({ id: 1, title: "Duna", rating: 8.2 })] };

const replaceState = vi.spyOn(window.history, "replaceState");

function renderRows() {
  render(
    <HomeGenreRows>
      <p>fileiras sem filtro</p>
    </HomeGenreRows>,
  );
}

const button = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  search = "";
  replaceState.mockClear();
  vi.mocked(loadRatedGenreRows).mockReset();
});

describe("HomeGenreRows", () => {
  it("sem nota no link, 'Todos' fica marcado e as fileiras normais aparecem", () => {
    renderRows();
    expect(button("Todos")).toHaveAttribute("aria-pressed", "true");
    expect(button("8+")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("fileiras sem filtro")).toBeInTheDocument();
    expect(loadRatedGenreRows).not.toHaveBeenCalled();
  });

  it("escolher 8+ marca o botão na hora, mostra esqueletos e depois as fileiras filtradas", async () => {
    const response = deferred();
    vi.mocked(loadRatedGenreRows).mockReturnValue(response.promise);
    renderRows();

    await userEvent.click(button("8+"));
    expect(button("8+")).toHaveAttribute("aria-pressed", "true");
    expect(button("Todos")).toHaveAttribute("aria-pressed", "false");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?nota=8");
    expect(loadRatedGenreRows).toHaveBeenCalledWith(8);
    expect(screen.queryByText("fileiras sem filtro")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Carregando filmes")).toBeInTheDocument();

    await act(async () => response.resolve([acao]));
    expect(screen.queryByLabelText("Carregando filmes")).not.toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Ação" });
    expect(within(region).getByRole("heading", { level: 3 })).toHaveTextContent("Duna");
    expect(within(region).getByRole("link", { name: "Ver todos de Ação" })).toHaveAttribute("href", "/explorar?genero=28&nota=8");
  });

  it("se nenhuma fileira tem filmes, mostra a mensagem com a nota escolhida", async () => {
    vi.mocked(loadRatedGenreRows).mockResolvedValue([]);
    renderRows();
    await userEvent.click(button("9+"));
    expect(await screen.findByText("Nenhum filme com nota 9+ por aqui. Tente uma nota menor.")).toBeInTheDocument();
  });

  it("se o servidor falha, avisa em vez de quebrar a página", async () => {
    vi.mocked(loadRatedGenreRows).mockRejectedValue(new Error("TMDB fora do ar"));
    renderRows();
    await userEvent.click(button("7+"));
    expect(await screen.findByText("Não foi possível filtrar agora. Tente de novo.")).toBeInTheDocument();
  });

  it("voltar para 'Todos' limpa o link e mostra as fileiras normais", async () => {
    search = "nota=8";
    vi.mocked(loadRatedGenreRows).mockResolvedValue([acao]);
    renderRows();
    await screen.findByRole("region", { name: "Ação" });

    await userEvent.click(button("Todos"));
    expect(replaceState).toHaveBeenLastCalledWith(null, "", "/");
    expect(screen.getByText("fileiras sem filtro")).toBeInTheDocument();
  });

  it("abrir um link com ?nota=9 já começa filtrado", () => {
    search = "nota=9";
    vi.mocked(loadRatedGenreRows).mockReturnValue(deferred().promise);
    renderRows();
    expect(button("9+")).toHaveAttribute("aria-pressed", "true");
    expect(loadRatedGenreRows).toHaveBeenCalledWith(9);
  });

  it("nota estranha no link vale como 'Todos'", () => {
    search = "nota=5";
    renderRows();
    expect(button("Todos")).toHaveAttribute("aria-pressed", "true");
    expect(loadRatedGenreRows).not.toHaveBeenCalled();
  });

  it("resposta atrasada de uma nota anterior não aparece por cima da nova", async () => {
    const lento = deferred();
    const rapido = deferred();
    vi.mocked(loadRatedGenreRows).mockReturnValueOnce(lento.promise).mockReturnValueOnce(rapido.promise);
    renderRows();

    await userEvent.click(button("7+"));
    await userEvent.click(button("9+"));
    await act(async () => rapido.resolve([]));
    await act(async () => lento.resolve([acao]));

    expect(screen.queryByRole("region", { name: "Ação" })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum filme com nota 9+ por aqui. Tente uma nota menor.")).toBeInTheDocument();
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Movie, Page } from "@/lib/tmdb/types";
import { makeMovie } from "@/test/fixtures/movies";
import { PaginatedMovieGrid } from "./PaginatedMovieGrid";

function pageOf(ids: number[], page: number, totalPages: number): Page<Movie> {
  return { items: ids.map((id) => makeMovie({ id, title: `Filme ${id}` })), page, totalPages };
}

const titles = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("PaginatedMovieGrid", () => {
  it("mostra a primeira página e acrescenta a próxima ao clicar", async () => {
    const loadPage = vi.fn().mockResolvedValue(pageOf([3, 4], 2, 2));
    render(<PaginatedMovieGrid initial={pageOf([1, 2], 1, 2)} loadPage={loadPage} />);
    expect(titles()).toEqual(["Filme 1", "Filme 2"]);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(loadPage).toHaveBeenCalledWith(2);
    expect(await screen.findByText("Filme 4")).toBeInTheDocument();
    expect(titles()).toEqual(["Filme 1", "Filme 2", "Filme 3", "Filme 4"]);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("não repete filmes que já estão na grade", async () => {
    const loadPage = vi.fn().mockResolvedValue(pageOf([2, 3], 2, 3));
    render(<PaginatedMovieGrid initial={pageOf([1, 2], 1, 3)} loadPage={loadPage} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Filme 3")).toBeInTheDocument();
    expect(titles()).toEqual(["Filme 1", "Filme 2", "Filme 3"]);
    expect(screen.getByRole("button", { name: "Carregar mais" })).toBeInTheDocument();
  });

  it("faz um pedido por vez mesmo com cliques repetidos", async () => {
    let resolve!: (page: Page<Movie>) => void;
    const loadPage = vi.fn(() => new Promise<Page<Movie>>((r) => (resolve = r)));
    render(<PaginatedMovieGrid initial={pageOf([1], 1, 3)} loadPage={loadPage} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    const busy = screen.getByRole("button", { name: "Carregando…" });
    expect(busy).toBeDisabled();
    fireEvent.click(busy);
    expect(loadPage).toHaveBeenCalledTimes(1);

    await act(async () => resolve(pageOf([2], 2, 3)));
    expect(screen.getByText("Filme 2")).toBeInTheDocument();
  });

  it("mostra erro e deixa tentar de novo", async () => {
    const loadPage = vi.fn().mockRejectedValueOnce(new Error("rede")).mockResolvedValueOnce(pageOf([2], 2, 2));
    render(<PaginatedMovieGrid initial={pageOf([1], 1, 2)} loadPage={loadPage} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar mais filmes. Tente de novo.");

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(await screen.findByText("Filme 2")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sem botão quando já está na última página", () => {
    render(<PaginatedMovieGrid initial={pageOf([1], 1, 1)} loadPage={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

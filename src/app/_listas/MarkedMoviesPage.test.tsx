import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UNAVAILABLE_MESSAGE } from "@/lib/auth";
import type { MovieDetails } from "@/lib/tmdb/types";
import { MarkedMoviesPage } from "./MarkedMoviesPage";

const { redirect, createClient, getUserId, listIds, getDetails } = vi.hoisted(() => ({
  redirect: vi.fn(),
  createClient: vi.fn(),
  getUserId: vi.fn(),
  listIds: vi.fn(),
  getDetails: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: createClient, getCurrentUserId: getUserId }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/marks", () => ({ listMarkedMovieIds: listIds }));
vi.mock("@/lib/tmdb/movies", () => ({ getMovieDetails: getDetails }));
vi.mock("next/navigation", () => ({ redirect, usePathname: () => "/quero-assistir" }));

const movie = (id: number): MovieDetails => ({ id, title: `Filme ${id}`, year: 2020, rating: 7, posterPath: null, backdropPath: null, providers: [], overview: "", runtime: null, genres: [], trailer: null });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  redirect.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  createClient.mockResolvedValue({});
  getUserId.mockResolvedValue("u1");
  listIds.mockResolvedValue([]);
  getDetails.mockImplementation(async (id: number) => movie(id));
});

describe("MarkedMoviesPage", () => {
  it("sem login manda para o Entrar com retorno", async () => {
    getUserId.mockResolvedValue(null);
    await expect(MarkedMoviesPage({ status: "quero_assistir" })).rejects.toThrow("REDIRECT:/entrar?voltar=%2Fquero-assistir");
    expect(redirect).toHaveBeenCalledWith("/entrar?voltar=%2Fquero-assistir");
  });

  it("mostra os filmes na ordem salva", async () => {
    listIds.mockResolvedValue([3, 1, 2]);
    render(await MarkedMoviesPage({ status: "quero_assistir" }));
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href")).filter((h) => h?.startsWith("/filme/"));
    expect(hrefs).toEqual(["/filme/3", "/filme/1", "/filme/2"]);
  });

  it("pula filmes que o TMDB não devolve", async () => {
    listIds.mockResolvedValue([1, 2, 3]);
    getDetails.mockImplementation(async (id: number) => {
      if (id === 1) return null;
      if (id === 2) throw new Error("falhou");
      return movie(id);
    });
    render(await MarkedMoviesPage({ status: "ja_assisti" }));
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href")).filter((h) => h?.startsWith("/filme/"));
    expect(hrefs).toEqual(["/filme/3"]);
  });

  it("lista vazia explica como marcar", async () => {
    render(await MarkedMoviesPage({ status: "quero_assistir" }));
    expect(screen.getByText('Você ainda não marcou nenhum filme. Abra um filme e toque em "Quero assistir".')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Descobrir filmes" })).toHaveAttribute("href", "/");
  });

  it("lista vazia de Já assisti usa o final próprio", async () => {
    render(await MarkedMoviesPage({ status: "ja_assisti" }));
    expect(screen.getByText('Você ainda não marcou nenhum filme. Abra um filme e toque em "Já assisti".')).toBeInTheDocument();
  });

  it("Supabase indisponível mostra o aviso (cliente nulo)", async () => {
    createClient.mockResolvedValue(null);
    render(await MarkedMoviesPage({ status: "quero_assistir" }));
    expect(screen.getByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("Supabase indisponível mostra o aviso (leitura falha)", async () => {
    listIds.mockRejectedValue(new Error("fora do ar"));
    render(await MarkedMoviesPage({ status: "quero_assistir" }));
    expect(screen.getByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("Supabase indisponível mostra o aviso (usuário não verificável)", async () => {
    getUserId.mockRejectedValue(new Error("fora do ar"));
    render(await MarkedMoviesPage({ status: "quero_assistir" }));
    expect(screen.getByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});

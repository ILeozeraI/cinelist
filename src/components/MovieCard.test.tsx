import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { MovieCard } from "./MovieCard";

describe("MovieCard", () => {
  it("leva aos detalhes e mostra pôster, título, ano, nota e logos", () => {
    render(<MovieCard movie={makeMovie()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/693134");
    expect(screen.getByRole("img", { name: "Pôster de Duna: Parte Dois" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Duna: Parte Dois" })).toBeInTheDocument();
    expect(screen.getByText("2024 · ★ 8.2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Netflix" })).toBeInTheDocument();
  });

  it("sem pôster mostra o título no lugar da imagem", () => {
    render(<MovieCard movie={makeMovie({ posterPath: null })} />);
    expect(screen.queryByRole("img", { name: /Pôster/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Duna: Parte Dois")).toHaveLength(2);
  });

  it("sem ano e sem nota mostra só um traço", () => {
    render(<MovieCard movie={makeMovie({ year: null, rating: 0, providers: [] })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });
});

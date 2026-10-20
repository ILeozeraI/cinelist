import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { TopTenRow } from "./TopTenRow";

describe("TopTenRow", () => {
  it("lista no máximo 10 filmes com pôster, em ordem, com a posição no nome do link", () => {
    const movies = [makeMovie({ id: 99, posterPath: null }), ...Array.from({ length: 12 }, (_, i) => makeMovie({ id: i + 1, title: `Filme ${i + 1}` }))];
    render(<TopTenRow movies={movies} />);

    const region = screen.getByRole("region", { name: "Top 10 nos streamings hoje" });
    const links = within(region).getAllByRole("link");
    expect(links).toHaveLength(10);
    expect(links[0]).toHaveAccessibleName("1º lugar: Filme 1");
    expect(links[0]).toHaveAttribute("href", "/filme/1");
    expect(links[9]).toHaveAccessibleName("10º lugar: Filme 10");
  });

  it("sem filmes com pôster não renderiza nada", () => {
    const { container } = render(<TopTenRow movies={[makeMovie({ posterPath: null })]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

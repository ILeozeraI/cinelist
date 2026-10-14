import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { EAGER_POSTERS, MovieGrid } from "./MovieGrid";

it("carrega na hora só os pôsteres da primeira linha da grade", () => {
  const movies = Array.from({ length: EAGER_POSTERS + 2 }, (_, i) => makeMovie({ id: i + 1, title: `Filme ${i + 1}` }));
  render(<MovieGrid movies={movies} />);
  const loading = screen.getAllByRole("img", { name: /Pôster/ }).map((img) => img.getAttribute("loading"));
  expect(loading).toEqual([...Array(EAGER_POSTERS).fill("eager"), "lazy", "lazy"]);
});

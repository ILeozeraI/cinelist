import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { makeMovie } from "@/test/fixtures/movies";
import { Hero } from "./Hero";

it("destaca o filme com título, informações e link para os detalhes", () => {
  render(<Hero movie={makeMovie()} />);
  const region = screen.getByRole("region", { name: "Destaque" });
  expect(region).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Duna: Parte Dois" })).toBeInTheDocument();
  expect(screen.getByText("2024 · ★ 8.2")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute("href", "/filme/693134");
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { makeFeatured } from "@/test/fixtures/movies";
import { Hero } from "./Hero";

it("destaca o filme com título, ranking, informações, sinopse e link para os detalhes", () => {
  render(<Hero movies={[makeFeatured({ rank: 2 })]} />);
  expect(screen.getByRole("region", { name: "Destaque" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Duna: Parte Dois" })).toBeInTheDocument();
  expect(screen.getByText("2º em alta nos streamings")).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Informações" })).toHaveTextContent("Nota 8.220242h 46minFicção científica, Aventura");
  expect(screen.getByText("Paul Atreides se une a Chani e aos Fremen.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute("href", "/filme/693134");
  // Com um filme só não há o que trocar.
  expect(screen.queryByRole("list", { name: "Outros destaques" })).not.toBeInTheDocument();
});

it("troca de destaque ao clicar em outro filme", async () => {
  render(<Hero movies={[makeFeatured(), makeFeatured({ id: 2, title: "Oppenheimer", rank: 3 })]} />);
  expect(screen.getByRole("button", { name: "Mostrar Duna: Parte Dois" })).toHaveAttribute("aria-pressed", "true");

  await userEvent.click(screen.getByRole("button", { name: "Mostrar Oppenheimer" }));

  expect(screen.getByRole("heading", { level: 1, name: "Oppenheimer" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute("href", "/filme/2");
  expect(screen.getByRole("button", { name: "Mostrar Oppenheimer" })).toHaveAttribute("aria-pressed", "true");
});

it("sem filmes não renderiza nada", () => {
  const { container } = render(<Hero movies={[]} />);
  expect(container).toBeEmptyDOMElement();
});

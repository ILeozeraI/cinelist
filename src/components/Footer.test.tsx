import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Footer } from "./Footer";

it("mostra os créditos obrigatórios do TMDB e da JustWatch", () => {
  render(<Footer />);
  expect(screen.getByText("Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.")).toBeInTheDocument();
  expect(screen.getByText(/Dados de streaming:/)).toHaveTextContent("Dados de streaming: JustWatch");
  expect(screen.getByRole("img", { name: "TMDB" })).toBeInTheDocument();
});

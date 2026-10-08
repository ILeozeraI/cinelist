import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { netflixProvider, primeProvider } from "@/test/fixtures/movies";
import { ProviderLogos } from "./ProviderLogos";

describe("ProviderLogos", () => {
  it("mostra cada logo com o nome do serviço como texto alternativo", () => {
    render(<ProviderLogos providers={[netflixProvider, primeProvider]} />);
    expect(screen.getByRole("img", { name: "Netflix" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Amazon Prime Video" })).toBeInTheDocument();
  });

  it("resume o excesso com +N", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Serviço ${i + 1}`, logoPath: `/s${i}.jpg` }));
    render(<ProviderLogos providers={many} max={4} />);
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("serviço sem logo aparece pelo nome", () => {
    render(<ProviderLogos providers={[{ id: 47, name: "Looke", logoPath: null }]} />);
    expect(screen.getByText("Looke")).toBeInTheDocument();
  });

  it("sem streamings não renderiza nada", () => {
    const { container } = render(<ProviderLogos providers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

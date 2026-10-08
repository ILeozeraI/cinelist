import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { ALL_GENRES } from "@/lib/genres";
import type { DiscoverFilters } from "@/lib/tmdb/types";
import { netflixProvider, primeProvider } from "@/test/fixtures/movies";
import { FiltersPanel } from "./FiltersPanel";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/explorar" }));

function renderPanel(filters: Partial<DiscoverFilters> = {}) {
  render(
    <FiltersPanel
      providers={[netflixProvider, primeProvider]}
      genres={ALL_GENRES}
      filters={{ ...DEFAULT_FILTERS, ...filters }}
      currentYear={2026}
    />,
  );
}

beforeEach(() => replace.mockClear());

describe("FiltersPanel", () => {
  it("marcar um streaming coloca no link", async () => {
    renderPanel();
    const netflix = screen.getByRole("button", { name: "Netflix" });
    expect(netflix).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(netflix);
    expect(replace).toHaveBeenCalledWith("/explorar?streaming=8", { scroll: false });
  });

  it("marcar um segundo streaming mantém o primeiro", async () => {
    renderPanel({ providerIds: [8] });
    await userEvent.click(screen.getByRole("button", { name: "Amazon Prime Video" }));
    expect(replace).toHaveBeenCalledWith("/explorar?streaming=8%2C119", { scroll: false });
  });

  it("desmarcar o único streaming volta ao link limpo", async () => {
    renderPanel({ providerIds: [8] });
    const netflix = screen.getByRole("button", { name: "Netflix" });
    expect(netflix).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(netflix);
    expect(replace).toHaveBeenCalledWith("/explorar", { scroll: false });
  });

  it("gênero, anos, nota e ordenação viram parâmetros do link", async () => {
    renderPanel();
    await userEvent.selectOptions(screen.getByLabelText("Gênero"), "27");
    expect(replace).toHaveBeenLastCalledWith("/explorar?genero=27", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ano de"), "2000");
    expect(replace).toHaveBeenLastCalledWith("/explorar?genero=27&de=2000", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ano até"), "2024");
    expect(replace).toHaveBeenLastCalledWith("/explorar?genero=27&de=2000&ate=2024", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Nota mínima"), "6.5");
    expect(replace).toHaveBeenLastCalledWith("/explorar?genero=27&de=2000&ate=2024&nota=6.5", { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "nota");
    expect(replace).toHaveBeenLastCalledWith("/explorar?genero=27&de=2000&ate=2024&nota=6.5&ordem=nota", { scroll: false });
  });

  it("mostra os valores atuais selecionados", () => {
    renderPanel({ genreId: 27, yearFrom: 2000, minRating: 7, sort: "lancamento" });
    expect(screen.getByLabelText("Gênero")).toHaveValue("27");
    expect(screen.getByLabelText("Ano de")).toHaveValue("2000");
    expect(screen.getByLabelText("Nota mínima")).toHaveValue("7");
    expect(screen.getByLabelText("Ordenar por")).toHaveValue("lancamento");
  });

  it("limpar filtros volta ao link limpo", async () => {
    renderPanel({ genreId: 27, sort: "nota" });
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(replace).toHaveBeenCalledWith("/explorar", { scroll: false });
  });

  it("cliques rápidos acumulam streamings mesmo sem o servidor responder", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Netflix" }));
    await userEvent.click(screen.getByRole("button", { name: "Amazon Prime Video" }));
    expect(replace).toHaveBeenLastCalledWith("/explorar?streaming=8%2C119", { scroll: false });
  });

  it("o gênero escolhido aparece na hora", async () => {
    renderPanel();
    await userEvent.selectOptions(screen.getByLabelText("Gênero"), "27");
    expect(screen.getByLabelText("Gênero")).toHaveValue("27");
  });
});

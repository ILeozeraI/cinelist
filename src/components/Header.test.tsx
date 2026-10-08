import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({ usePathname: () => "/explorar" }));

it("tem os links principais, marca a página atual e envia a busca para /buscar", () => {
  render(<Header />);

  expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("aria-current", "page");

  const input = screen.getByRole("searchbox", { name: "Buscar filme" });
  expect(input).toHaveAttribute("name", "q");
  expect(input.closest("form")).toHaveAttribute("action", "/buscar");
});

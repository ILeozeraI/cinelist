import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Header } from "./Header";

let pathname = "/explorar";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/supabase/browser", () => ({ getSupabaseBrowserClient: () => null }));
vi.mock("@/app/auth-actions", () => ({ signOut: vi.fn() }));

beforeEach(() => {
  pathname = "/explorar";
});

it("tem os links principais, marca a página atual e envia a busca para /buscar", () => {
  render(<Header />);

  expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "Explorar" })).toHaveAttribute("aria-current", "page");

  const input = screen.getByRole("searchbox", { name: "Buscar filme" });
  expect(input).toHaveAttribute("name", "q");
  expect(input.closest("form")).toHaveAttribute("action", "/buscar");
});

it("Início fica ativo em /quero-assistir", () => {
  pathname = "/quero-assistir";
  render(<Header />);

  expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Explorar" })).not.toHaveAttribute("aria-current");
});

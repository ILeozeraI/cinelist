import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeTabs } from "./HomeTabs";

vi.mock("next/navigation", () => ({ usePathname: () => "/ja-assisti" }));

describe("HomeTabs", () => {
  it("marca a aba atual", () => {
    render(<HomeTabs />);
    const nav = screen.getByRole("navigation", { name: "Suas listas" });
    const links = Array.from(nav.querySelectorAll("a"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/", "/quero-assistir", "/ja-assisti"]);
    expect(screen.getByRole("link", { name: "Já assisti" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Descobrir" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Quero assistir" })).not.toHaveAttribute("aria-current");
  });
});

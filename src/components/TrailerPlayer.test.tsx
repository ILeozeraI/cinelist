import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { TrailerPlayer } from "./TrailerPlayer";

it("só carrega o YouTube depois do clique", async () => {
  const { container } = render(<TrailerPlayer trailer={{ key: "pt1", name: "Trailer" }} title="Duna" />);
  expect(container.querySelector("iframe")).toBeNull();

  await userEvent.click(screen.getByRole("button", { name: "Assistir ao trailer de Duna" }));

  const iframe = screen.getByTitle("Trailer de Duna");
  expect(iframe.tagName).toBe("IFRAME");
  expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/pt1?autoplay=1");
});

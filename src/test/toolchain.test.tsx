import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("renderiza React e usa os matchers do jest-dom", () => {
  render(<p>ok</p>);
  expect(screen.getByText("ok")).toBeInTheDocument();
});

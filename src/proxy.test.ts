import { describe, expect, it } from "vitest";
import { config } from "@/proxy";

describe("config.matcher", () => {
  const [pattern] = config.matcher;

  it("escapa o ponto da extensão de imagem", () => {
    expect(pattern).toContain(String.raw`\.(?:`);
  });

  it("exclui api/", () => {
    expect(pattern).toContain("api/");
  });
});

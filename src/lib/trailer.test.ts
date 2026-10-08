import { describe, expect, it } from "vitest";
import { video } from "@/test/fixtures/tmdb";
import { pickTrailer } from "./trailer";

describe("pickTrailer", () => {
  it("prioriza pt oficial > pt > en oficial > en", () => {
    const enUnofficial = video({ key: "en", official: false });
    const enOfficial = video({ key: "enOf" });
    const ptUnofficial = video({ key: "pt", iso_639_1: "pt", iso_3166_1: "BR", official: false });
    const ptOfficial = video({ key: "ptOf", iso_639_1: "pt", iso_3166_1: "BR" });

    expect(pickTrailer([enUnofficial, enOfficial, ptUnofficial, ptOfficial])?.key).toBe("ptOf");
    expect(pickTrailer([enUnofficial, enOfficial, ptUnofficial])?.key).toBe("pt");
    expect(pickTrailer([enUnofficial, enOfficial])?.key).toBe("enOf");
    expect(pickTrailer([enUnofficial])?.key).toBe("en");
  });

  it("ignora o que não é trailer do YouTube", () => {
    expect(pickTrailer([video({ type: "Teaser" }), video({ site: "Vimeo" })])).toBeNull();
  });

  it("ignora outros idiomas", () => {
    expect(pickTrailer([video({ iso_639_1: "es" })])).toBeNull();
  });

  it("devolve o nome junto com a chave", () => {
    expect(pickTrailer([video({ key: "k1", name: "Trailer Oficial" })])).toEqual({ key: "k1", name: "Trailer Oficial" });
  });

  it("lista vazia → null", () => {
    expect(pickTrailer([])).toBeNull();
  });
});

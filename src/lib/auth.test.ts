import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  loginHref,
  safeReturnPath,
  UNAVAILABLE_MESSAGE,
} from "./auth";

describe("safeReturnPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeReturnPath("/filme/123")).toBe("/filme/123");
    expect(safeReturnPath("/quero-assistir")).toBe("/quero-assistir");
  });

  it.each([
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "",
    undefined,
    42,
    "/filme/1\n",
  ])("recusa destinos externos (%s)", (raw) => {
    expect(safeReturnPath(raw)).toBe("/");
  });
});

describe("loginHref", () => {
  it("codifica o retorno", () => {
    expect(loginHref("/filme/1")).toBe("/entrar?voltar=%2Ffilme%2F1");
  });
});

describe("authErrorMessage", () => {
  it.each([
    ["invalid_credentials", "E-mail ou senha incorretos."],
    [
      "user_already_exists",
      "Este e-mail já tem uma conta. Use a opção Entrar.",
    ],
    ["email_exists", "Este e-mail já tem uma conta. Use a opção Entrar."],
    ["weak_password", "A senha precisa ter pelo menos 6 caracteres."],
    ["email_address_invalid", "Digite um e-mail válido."],
    ["validation_failed", "Digite um e-mail válido."],
    [
      "over_request_rate_limit",
      "Muitas tentativas. Espere um pouco e tente de novo.",
    ],
    [
      "over_email_send_rate_limit",
      "Muitas tentativas. Espere um pouco e tente de novo.",
    ],
    ["qualquer_outro", UNAVAILABLE_MESSAGE],
    ["toString", UNAVAILABLE_MESSAGE],
  ])("mapeia %s", (code, message) => {
    expect(authErrorMessage({ code })).toBe(message);
  });

  it("null e erro sem código viram indisponível", () => {
    expect(authErrorMessage(null)).toBe(UNAVAILABLE_MESSAGE);
    expect(authErrorMessage({ status: 0 })).toBe(UNAVAILABLE_MESSAGE);
  });
});

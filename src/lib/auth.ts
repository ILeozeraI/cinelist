export const UNAVAILABLE_MESSAGE =
  "Não foi possível conectar agora. Tente de novo em instantes.";

export type AuthFormState = { error: string | null; email: string };

// Só aceita caminhos internos do site; qualquer outra coisa volta para a Descobrir.
export function safeReturnPath(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\"))
    return "/";
  if (/[\u0000-\u001f\u007f]/.test(raw)) return "/";
  return raw;
}

export function loginHref(returnTo: string): string {
  return `/entrar?voltar=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  user_already_exists: "Este e-mail já tem uma conta. Use a opção Entrar.",
  email_exists: "Este e-mail já tem uma conta. Use a opção Entrar.",
  weak_password: "A senha precisa ter pelo menos 6 caracteres.",
  email_address_invalid: "Digite um e-mail válido.",
  validation_failed: "Confira o e-mail e a senha e tente de novo.",
  over_request_rate_limit:
    "Muitas tentativas. Espere um pouco e tente de novo.",
  over_email_send_rate_limit:
    "Muitas tentativas. Espere um pouco e tente de novo.",
};

export function authErrorMessage(
  error: { code?: string; status?: number } | null,
): string {
  const code = error?.code;
  return (
    (code !== undefined && Object.hasOwn(MESSAGES, code)
      ? MESSAGES[code]
      : undefined) ?? UNAVAILABLE_MESSAGE
  );
}

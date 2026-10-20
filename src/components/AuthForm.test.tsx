import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signIn, signUp } from "@/app/auth-actions";
import { AuthForm } from "./AuthForm";

vi.mock("@/app/auth-actions", () => ({ signIn: vi.fn(), signUp: vi.fn() }));

beforeEach(() => {
  vi.mocked(signIn).mockReset().mockResolvedValue({ error: null, email: "" });
  vi.mocked(signUp).mockReset().mockResolvedValue({ error: null, email: "" });
});

// O botão de enviar tem o mesmo nome da aba; ele é o único do tipo submit.
function submitButton() {
  return screen
    .getAllByRole("button")
    .find((b) => (b as HTMLButtonElement).type === "submit")!;
}

describe("AuthForm", () => {
  it("começa em Entrar e troca para Criar conta", async () => {
    const user = userEvent.setup();
    render(<AuthForm returnTo="/" />);

    expect(
      screen.getByRole("button", { name: "Entrar", pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar conta", pressed: false }),
    ).toBeInTheDocument();
    expect(submitButton()).toHaveTextContent("Entrar");

    await user.click(
      screen.getByRole("button", { name: "Criar conta", pressed: false }),
    );

    expect(
      screen.getByRole("button", { name: "Criar conta", pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Entrar", pressed: false }),
    ).toBeInTheDocument();
    expect(submitButton()).toHaveTextContent("Criar conta");
  });

  it("mostra a regra da senha e o erro devolvido", async () => {
    const user = userEvent.setup();
    vi.mocked(signUp).mockResolvedValue({
      error: "Este e-mail já tem uma conta. Use a opção Entrar.",
      email: "a@b.com",
    });
    render(<AuthForm returnTo="/" />);

    expect(
      screen.queryByText("Mínimo de 6 caracteres"),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Criar conta", pressed: false }),
    );
    expect(screen.getByText("Mínimo de 6 caracteres")).toBeInTheDocument();

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Este e-mail já tem uma conta. Use a opção Entrar.",
    );
  });

  it("o erro do Entrar some ao trocar para Criar conta", async () => {
    const user = userEvent.setup();
    vi.mocked(signIn).mockResolvedValue({
      error: "E-mail ou senha incorretos.",
      email: "a@b.com",
    });
    render(<AuthForm returnTo="/" />);

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "errada1");
    await user.click(submitButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha incorretos.",
    );

    await user.click(
      screen.getByRole("button", { name: "Criar conta", pressed: false }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("envia o voltar escondido", () => {
    const { container } = render(<AuthForm returnTo="/filme/7" />);
    const hidden = container.querySelector(
      'input[type="hidden"][name="voltar"]',
    );
    expect(hidden).toHaveValue("/filme/7");
  });
});

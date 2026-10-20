import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-e2e-123";
let contador = 0;
const novoEmail = () => `e2e-${Date.now()}-${contador++}@cinelist.test`;

async function criarConta(page: Page, email: string) {
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Criar conta", exact: true }).first().click();
  await main.locator('input[name="email"]').fill(email);
  await main.locator('input[name="senha"]').fill(SENHA);
  await main.locator('button[type="submit"]').click();
}

async function abrirPrimeiroFilmeDeAcao(page: Page) {
  await page.goto("/");
  const acao = page.getByRole("region", { name: "Ação", exact: true });
  await acao.locator('a[href^="/filme/"]').first().click();
  await expect(page).toHaveURL(/\/filme\/\d+$/);
}

test("aba pessoal sem login pede login", async ({ page }) => {
  await page.goto("/quero-assistir");
  await expect(page).toHaveURL(/\/entrar\?voltar=%2Fquero-assistir$/);
});

test("marcar sem login leva ao Entrar e volta para o filme", async ({ page }) => {
  await abrirPrimeiroFilmeDeAcao(page);
  const caminho = new URL(page.url()).pathname;
  await page
    .getByRole("group", { name: "Sua lista" })
    .getByRole("button", { name: "Quero assistir", exact: true })
    .click();
  await expect(page).toHaveURL(/\/entrar\?voltar=/);

  await criarConta(page, novoEmail());
  await expect(page).toHaveURL(new RegExp(`${caminho}$`));
});

test("fluxo completo", async ({ page }) => {
  const email = novoEmail();
  await page.goto("/entrar");
  await criarConta(page, email);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("banner").getByRole("button", { name: email })).toBeVisible();

  await abrirPrimeiroFilmeDeAcao(page);
  const caminho = new URL(page.url()).pathname;
  const grupo = page.getByRole("group", { name: "Sua lista" });
  const quero = grupo.getByRole("button", { name: "Quero assistir", exact: true });
  const jaVi = grupo.getByRole("button", { name: "Já assisti", exact: true });
  await quero.click();
  await expect(quero).toHaveAttribute("aria-pressed", "true");
  await expect(quero).toBeEnabled(); // o botão trava enquanto salva

  await page.goto("/quero-assistir");
  await expect(page.locator('a[href^="/filme/"]')).toHaveCount(1);
  await expect(page.locator(`a[href="${caminho}"]`).first()).toBeVisible();

  await page.goto(caminho);
  await page
    .getByRole("group", { name: "Sua lista" })
    .getByRole("button", { name: "Já assisti", exact: true })
    .click();
  await expect(jaVi).toHaveAttribute("aria-pressed", "true");
  await expect(jaVi).toBeEnabled();

  await page.goto("/quero-assistir");
  await expect(
    page.getByText('Você ainda não marcou nenhum filme. Abra um filme e toque em "Quero assistir".'),
  ).toBeVisible();
  await page.goto("/ja-assisti");
  await expect(page.locator('a[href^="/filme/"]')).toHaveCount(1);
  await expect(page.locator(`a[href="${caminho}"]`).first()).toBeVisible();

  await page.getByRole("banner").getByRole("button", { name: email }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
});

test("entrar com senha errada mostra o erro", async ({ page }) => {
  await page.goto("/entrar");
  const main = page.getByRole("main");
  await main.locator('input[name="email"]').fill(`naoexiste-${Date.now()}@cinelist.test`);
  await main.locator('input[name="senha"]').fill("senha-errada-1");
  await main.locator('button[type="submit"]').click();
  await expect(main.getByRole("alert")).toContainText("E-mail ou senha incorretos.");
});

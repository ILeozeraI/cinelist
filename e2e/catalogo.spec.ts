import { expect, test, type Locator, type Page } from "@playwright/test";

const cardsIn = (scope: Page | Locator) => scope.locator('a[href^="/filme/"]');

test("Início mostra fileiras de gênero com filmes", async ({ page }) => {
  await page.goto("/");
  const acao = page.getByRole("region", { name: "Ação", exact: true });
  await expect(acao).toBeVisible();
  await expect(cardsIn(acao).first()).toBeVisible();
});

test("card abre os detalhes e Voltar retorna", async ({ page }) => {
  await page.goto("/");
  await cardsIn(page.getByRole("region", { name: "Ação", exact: true })).first().click();
  await expect(page).toHaveURL(/\/filme\/\d+$/);
  await expect(page.getByRole("heading", { name: "Onde assistir" })).toBeVisible();
  await page.getByRole("button", { name: "← Voltar" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("filme inexistente mostra página amigável", async ({ page }) => {
  await page.goto("/filme/abc");
  await expect(page.getByRole("heading", { name: "Filme não encontrado" })).toBeVisible();
});

test("Explorar: filtro de gênero muda o link e carregar mais traz mais filmes", async ({ page }) => {
  await page.goto("/explorar");
  await page.getByLabel("Gênero").selectOption({ label: "Terror" });
  await expect(page).toHaveURL(/genero=27/);

  const grid = page.getByRole("list", { name: "Filmes" });
  await expect(cardsIn(grid).first()).toBeVisible();
  const before = await cardsIn(grid).count();
  await page.getByRole("button", { name: "Carregar mais" }).click();
  await expect.poll(() => cardsIn(grid).count()).toBeGreaterThan(before);
});

test("Busca encontra um filme visto na Início", async ({ page }) => {
  await page.goto("/");
  const firstTitle = page.getByRole("region", { name: "Comédia", exact: true }).getByRole("heading", { level: 3 }).first();
  const title = ((await firstTitle.textContent()) ?? "").trim();
  expect(title).not.toBe("");

  const search = page.getByRole("searchbox", { name: "Buscar filme" });
  await search.fill(title);
  await search.press("Enter");

  await expect(page).toHaveURL(/\/buscar\?q=/);
  await expect(page.locator('a[href^="/filme/"]', { hasText: title }).first()).toBeVisible();
});

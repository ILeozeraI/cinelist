import { expect, test, type Locator, type Page } from "@playwright/test";

const cardsIn = (scope: Page | Locator) => scope.locator('a[href^="/filme/"]');

test("Início mostra fileiras de gênero com filmes", async ({ page }) => {
  await page.goto("/");
  const acao = page.getByRole("region", { name: "Ação", exact: true });
  await expect(acao).toBeVisible();
  await expect(cardsIn(acao).first()).toBeVisible();
});

test("Início: filtro 8+ deixa só filmes com nota 8 ou mais e mantém o Top 10", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "8+" }).click();
  await expect(page).toHaveURL(/\/\?nota=8$/);
  await expect(page.getByRole("button", { name: "8+" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("region", { name: "Top 10 nos streamings hoje" })).toBeVisible();

  // Fileiras filtradas são as que levam a nota para o Explorar.
  const filtered = page.locator('section:has(a[href*="nota=8"])');
  await expect(filtered.first()).toBeVisible();
  const ratings = (await cardsIn(filtered).locator("p").allTextContents()).map((t) => Number(t.match(/(\d+\.\d)$/)?.[1]));
  expect(ratings.length).toBeGreaterThan(0);
  for (const rating of ratings) expect(rating).toBeGreaterThanOrEqual(8);

  await page.reload();
  await expect(page.getByRole("button", { name: "8+" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Todos" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('section:has(a[href*="nota="])')).toHaveCount(0);
});

test("card abre os detalhes e Voltar retorna", async ({ page }) => {
  await page.goto("/");
  await cardsIn(page.getByRole("region", { name: "Ação", exact: true })).first().click();
  await expect(page).toHaveURL(/\/filme\/\d+$/);
  await expect(page.getByRole("heading", { name: "Onde assistir" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar" }).click();
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

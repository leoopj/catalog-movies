import { expect, test } from "@playwright/test";

test("fluxo principal: home → trilho da Netflix → explorar filtrado → detalhes do filme", async ({
  page,
}) => {
  await page.goto("/");

  const netflixSection = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Netflix", exact: true }) });
  await netflixSection.getByRole("link", { name: "Ver todos" }).click();

  await expect(page).toHaveURL(/\/explorar\?servicos=8/);
  await expect(page.getByRole("button", { name: "Netflix", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.locator('a[href^="/filme/"]').first().click();

  await expect(page.getByText("Onde assistir no Brasil")).toBeVisible();
});

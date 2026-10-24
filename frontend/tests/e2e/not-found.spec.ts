import { expect, test } from "@playwright/test";

test("the build ships 404.html for the routing config", async ({ request }) => {
  const response = await request.get("/404.html");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<meta name="robots" content="noindex">');
  expect(html).toMatch(/page not found/i);
});

test("an unknown URL shows the 404 page with ways back", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/page not found/i);
  const main = page.locator("main");
  for (const href of ["/", "/services", "/quote"]) {
    await expect(main.locator(`a[href="${href}"]`).first()).toBeVisible();
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
});

import { expect, test, type APIRequestContext } from "@playwright/test";

async function sitemapPaths(request: APIRequestContext) {
  const xml = await (await request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
}

test("no page renders testimonials while they are switched off", async ({ request }) => {
  const paths = await sitemapPaths(request);
  expect(paths.length).toBeGreaterThan(10);
  for (const path of paths) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toMatch(/testimonial/i);
  }
});

test("the testimonials section renders an entry when switched on", async ({ page }) => {
  await page.goto("/e2e/testimonials");
  const section = page.locator("[data-testimonials]");
  await expect(section).toHaveCount(1);
  await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(section.locator("blockquote")).toHaveCount(1);
  await expect(section.locator("blockquote")).toContainText("Fixture testimonial text.");
  await expect(section.locator("figcaption")).toContainText("Fixture Name");
  await expect(page.locator("#off [data-testimonials]")).toHaveCount(0);
  await expect(page.locator("#empty [data-testimonials]")).toHaveCount(0);
});

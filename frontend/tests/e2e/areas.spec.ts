import { expect, test } from "@playwright/test";

const areas = [
  { path: "/areas/solihull", name: "Solihull" },
  { path: "/areas/knowle-and-dorridge", name: "Knowle & Dorridge" },
  { path: "/areas/sutton-coldfield", name: "Sutton Coldfield" },
  { path: "/areas/edgbaston-and-harborne", name: "Edgbaston & Harborne" },
  { path: "/areas/barnt-green-and-bromsgrove", name: "Barnt Green & Bromsgrove" },
  { path: "/areas/malvern", name: "Malvern" },
  { path: "/areas/broadway", name: "Broadway" },
  { path: "/areas/pershore", name: "Pershore" },
  { path: "/areas/evesham", name: "Evesham" },
  { path: "/areas/stratford-upon-avon", name: "Stratford-upon-Avon" },
];

test("the areas overview links to every area page", async ({ page }) => {
  await page.goto("/areas");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const main = page.locator("main");
  for (const area of areas) {
    await expect(main.locator(`a[href="${area.path}"]`).first()).toBeVisible();
  }
  await expect(main.locator('a[href="/quote"]').first()).toBeVisible();
});

test("the home page links each area to its page", async ({ page }) => {
  await page.goto("/");
  for (const area of areas) {
    await expect(page.locator("#areas").locator(`a[href="${area.path}"]`)).toHaveCount(1);
  }
});

test("each area page has its heading, copy, a quote link and LocalBusiness JSON-LD for that area", async ({ page }) => {
  for (const area of areas) {
    await page.goto(area.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(area.name);
    const main = page.locator("main");
    await expect(main.locator('a[href="/quote"]').first()).toBeVisible();
    await expect(main.locator('a[href="/areas"]').first()).toBeAttached();
    const words = (await main.locator("[data-area-copy]").innerText()).split(/\s+/).filter(Boolean).length;
    expect(words, area.path).toBeGreaterThanOrEqual(150);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts).toHaveLength(1);
    const data = JSON.parse(scripts[0]);
    expect(data["@type"]).toBe("LocalBusiness");
    expect(data.areaServed).toEqual([{ "@type": "Place", name: area.name }]);
    expect(data.mainEntityOfPage).toBe(await page.locator('link[rel="canonical"]').getAttribute("href"));
  }
});

test("at 360px the area pages do not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ["/areas", ...areas.map((area) => area.path)]) {
    await page.goto(path);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
  }
});

import { expect, test } from "@playwright/test";

const lead = [
  { path: "/services/plastering", name: "Plastering" },
  { path: "/services/painting-and-decorating", name: "Painting & Decorating" },
  { path: "/services/gardening-and-landscaping", name: "Gardening & Landscaping" },
];

test("the services overview links to each lead service and lists the secondary services", async ({ page }) => {
  await page.goto("/services");
  const main = page.locator("main");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const service of lead) {
    await expect(main.locator(`a[href="${service.path}"]`).first()).toBeVisible();
  }
  for (const name of ["Kitchen fitting", "Carpentry & panelling", "Loft conversion"]) {
    await expect(main.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(main.locator('a[href="/quote"]').first()).toBeVisible();
});

test("each lead service page has its own heading, photos and a quote link", async ({ page }) => {
  const titles = new Set<string>();
  for (const service of lead) {
    await page.goto(service.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.name);
    titles.add(await page.title());
    const main = page.locator("main");
    await expect(main.locator('a[href="/quote"]').first()).toBeVisible();
    const images = main.getByRole("img");
    expect(await images.count()).toBeGreaterThan(0);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute("alt", /.{10,}/);
    }
    for (const other of lead.filter((entry) => entry.path !== service.path)) {
      await expect(main.locator(`a[href="${other.path}"]`).first()).toBeAttached();
    }
  }
  await page.goto("/services");
  titles.add(await page.title());
  expect(titles.size).toBe(4);
});

test("the home page service cards come from the same service data", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#services li");
  await expect(cards).toHaveCount(6);
  for (const service of lead) {
    await expect(page.locator("#services").locator(`a[href="${service.path}"]`)).toHaveCount(1);
  }
});

test("at 360px the service pages do not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ["/services", ...lead.map((service) => service.path)]) {
    await page.goto(path);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
  }
});

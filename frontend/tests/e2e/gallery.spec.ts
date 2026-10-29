import { expect, test } from "@playwright/test";
import { builtFile, pageImages } from "./built-files";

const banned =
  /insured|accredit|guarantee|review|award|certified|approved|testimonial|start to finish|from the first call|\d+\s*(jobs|customers|clients|homes)/i;

test.describe("projects gallery", () => {
  test("shows every project as AVIF and WebP with a JPEG fallback, alt text and its service", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const figures = page.locator("main figure");
    await expect(figures).toHaveCount(28);
    const alts = new Set<string>();
    for (const figure of await figures.all()) {
      await expect(figure.locator('source[type="image/avif"]')).toHaveCount(1);
      await expect(figure.locator('source[type="image/webp"]')).toHaveCount(1);
      const image = figure.locator("img");
      await expect(image).toHaveAttribute("src", /\.jpe?g/);
      const alt = (await image.getAttribute("alt")) ?? "";
      expect(alt.length).toBeGreaterThan(20);
      alts.add(alt);
      await expect(figure.locator("figcaption")).toHaveText(
        /^(Plastering|Painting & Decorating|Gardening & Landscaping|Kitchen fitting|Carpentry & panelling|Loft conversion)$/,
      );
    }
    expect(alts.size).toBe(28);
    await expect(page.locator("main").locator('a[href="/quote"]').first()).toBeVisible();
  });

  test("loads images below the first row lazily and keeps every image sized", async ({ page }) => {
    await page.goto("/projects");
    const images = page.locator("main figure img");
    await expect(images.last()).toHaveAttribute("loading", "lazy");
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute("width", /\d+/);
      await expect(image).toHaveAttribute("height", /\d+/);
    }
  });

  test("ships no image file over 300 KB", async ({ page }) => {
    await page.goto("/projects");
    const files = (await pageImages(page, "main")).map(builtFile);
    expect(files.length).toBeGreaterThan(28);
    for (const file of files) {
      expect(file.exists, file.path).toBe(true);
      expect(file.size, file.path).toBeLessThanOrEqual(300_000);
    }
  });

  test("does not scroll sideways at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    for (const path of ["/projects", "/about"]) {
      await page.goto(path);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
    }
  });
});

test("the projects page speaks as we, without naming Darren", async ({ page }) => {
  await page.goto("/projects");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/Darren|\b(he|him|his)\b/i);
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).not.toMatch(/Darren/);
});

test.describe("about page", () => {
  test("introduces Darren with known facts, a job photo and a quote link", async ({ page }) => {
    await page.goto("/about");
    const main = page.locator("main");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meet Darren");
    await expect(main).toContainText("Darren Goodchild");
    await expect(main).toContainText("25 years");
    await expect(main.locator("[data-placeholder]")).toHaveCount(0);
    await expect(main).not.toContainText("[PLACEHOLDER]");
    const photo = main.locator("section").first().locator("picture img");
    await expect(photo).toHaveAttribute("alt", /plastered walls and ceiling with plastering tools/);
    await expect(photo).toHaveAttribute("src", /\.jpe?g/);
    await expect(main.locator('a[href="/quote"]').first()).toBeVisible();
    await expect(main.locator('a[href="/projects"]').first()).toBeVisible();
  });

  test("speaks as we after the intro", async ({ page }) => {
    await page.goto("/about");
    const sections = await page.locator("main section").all();
    expect(sections.length).toBeGreaterThan(1);
    for (const section of sections.slice(1)) {
      expect(await section.innerText()).not.toMatch(/Darren|\b(he|him|his)\b/i);
    }
    expect(await sections[0].innerText()).not.toMatch(/\b(he|him|his)\b/i);
  });

  test("makes no unverified claims", async ({ page }) => {
    await page.goto("/about");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(banned);
  });
});

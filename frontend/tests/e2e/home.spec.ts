import { expect, test, type Locator, type Page } from "@playwright/test";

async function runningAnimations(page: Page) {
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => animation.playState === "running")
      .map((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return target instanceof Element ? target.className.toString() : String(target);
      }),
  );
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    }
  });
}

async function value(slider: Locator) {
  return Number(await slider.inputValue());
}

async function dragByTouch(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  const steps = 8;
  for (let step = 1; step <= steps; step++) {
    const point = { x: from.x + ((to.x - from.x) * step) / steps, y: from.y + ((to.y - from.y) * step) / steps };
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

test.describe("home page", () => {
  test("the headline and a quote and call action are visible without scrolling", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("#hero");
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({ ratio: 1 });
    await expect(hero.getByRole("link", { name: /get a quote/i })).toBeInViewport({ ratio: 1 });
    await expect(hero.getByRole("link", { name: /get a quote/i })).toHaveAttribute("href", "/quote");
    await expect(hero.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/447456182265/);
  });

  test("at 360px the hero actions fit above the contact bar and nothing scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    const action = page.locator("#hero").getByRole("link", { name: /get a quote/i });
    await expect(action).toBeInViewport({ ratio: 1 });
    const box = await action.boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport && box.y + box.height).toBeLessThanOrEqual((viewport?.height ?? 0) - 56);
    await scrollThrough(page);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("has the service cards, process track, stats, areas and quote call to action", async ({ page }) => {
    await page.goto("/");
    const services = page.locator("#services");
    for (const href of ["/services/plastering", "/services/painting-and-decorating", "/services/gardening-and-landscaping"]) {
      await expect(services.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    const track = page.getByRole("region", { name: /how a job comes together/i });
    await expect(track.getByRole("listitem")).toHaveCount(5);
    await expect(track).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#stats")).toContainText("25+");
    await expect(page.locator("#areas").getByRole("listitem")).toHaveCount(10);
    await expect(page.locator("#get-a-quote").locator('a[href="/quote"]')).toHaveCount(1);
    await expect(page.locator("#get-a-quote").locator('a[href="tel:+447456182265"]')).toHaveCount(1);
  });

  test("shows only stated facts as stats", async ({ page }) => {
    await page.goto("/");
    const values = await page.locator("#stats li strong").allInnerTexts();
    expect(values).toEqual(["25+"]);
  });

  test("the process track scrolls sideways by swipe without the page doing so", async ({ page }) => {
    await page.goto("/");
    const track = page.getByRole("region", { name: /how a job comes together/i });
    await track.scrollIntoViewIfNeeded();
    const sizes = await track.evaluate((element) => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
    expect(sizes.scrollWidth).toBeGreaterThan(sizes.clientWidth);
    await track.evaluate((element) => element.scrollBy({ left: 400, behavior: "instant" }));
    expect(await track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    for (const image of await track.getByRole("img").all()) {
      await expect(image).toHaveAttribute("alt", /.{10,}/);
    }
  });

  test("shows no before and after slider until a matching pair of the same room exists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-before-after]")).toHaveCount(0);
  });

  test("layout shift stays under 0.1", async ({ page }) => {
    await page.goto("/");
    await scrollThrough(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
              if (!entry.hadRecentInput) {
                total += entry.value;
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(shift).toBeLessThan(0.1);
  });
});

test("the home page speaks as we, without naming Darren", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/Darren|\b(he|him|his)\b/i);
  await expect(page.locator("#stats")).toHaveAttribute("aria-label", "Why choose us");
});

test.describe("with motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("the headline skims in on load", async ({ page }) => {
    await page.goto("/");
    const lines = page.locator("h1 [data-motion=skim]");
    await expect(lines).toHaveCount(2);
    const names = await lines.first().evaluate((element) =>
      element.getAnimations().map((animation) => (animation as CSSAnimation).animationName),
    );
    expect(names).toContain("motion-skim");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no element animates", async ({ page }) => {
    await page.goto("/");
    expect(await runningAnimations(page)).toEqual([]);
    await scrollThrough(page);
    expect(await runningAnimations(page)).toEqual([]);
    const card = page.locator("#services li a").first();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    expect(await runningAnimations(page)).toEqual([]);
    await expect(card).toHaveCSS("transform", "none");
  });
});

test.describe("before and after slider", () => {
  test("moves by arrow keys", async ({ page }) => {
    await page.goto("/e2e/before-after");
    const slider = page.getByRole("slider", { name: /compare/i });
    const root = page.locator("[data-before-after]");
    await expect(slider).toHaveValue("50");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect(await value(slider)).toBeGreaterThan(50);
    await expect(root).toHaveAttribute("style", new RegExp(`--split: ?${await value(slider)}%`));
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("100");
  });

  test("moves by touch drag", async ({ page, hasTouch }) => {
    test.skip(!hasTouch, "needs touch; runs on the mobile project");
    await page.goto("/e2e/before-after");
    const slider = page.getByRole("slider", { name: /compare/i });
    const root = page.locator("[data-before-after]");
    const box = await root.boundingBox();
    expect(box).toBeTruthy();
    const y = box!.y + box!.height / 2;
    await dragByTouch(page, { x: box!.x + box!.width / 2, y }, { x: box!.x + box!.width * 0.2, y });
    const moved = await value(slider);
    expect(moved).toBeGreaterThanOrEqual(15);
    expect(moved).toBeLessThanOrEqual(25);
    await expect(root).toHaveAttribute("style", new RegExp(`--split: ?${moved}%`));
  });

  test("labels both photos and keeps the slider at least 44px tall", async ({ page }) => {
    await page.goto("/e2e/before-after");
    const root = page.locator("[data-before-after]");
    await expect(root.getByRole("img")).toHaveCount(2);
    await expect(root.getByText("Before")).toBeVisible();
    await expect(root.getByText("After")).toBeVisible();
    const box = await root.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

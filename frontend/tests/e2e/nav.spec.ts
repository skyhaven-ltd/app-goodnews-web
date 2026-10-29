import { expect, test, type Locator, type Page } from "@playwright/test";

const small = { width: 360, height: 740 };
const large = { width: 1024, height: 800 };

async function press(locator: Locator, hasTouch: boolean) {
  if (hasTouch) {
    await locator.tap();
  } else {
    await locator.click();
  }
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

async function expectTapTargets(page: Page, selector: string) {
  const boxes = await page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: element.textContent?.trim(), width: rect.width, height: rect.height };
      }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.height, `${box.label} height`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${box.label} width`).toBeGreaterThanOrEqual(44);
  }
}

test.describe("at 360px", () => {
  test.use({ viewport: small });

  for (const path of ["/", "/quote"]) {
    test(`${path} has the sticky contact bar and no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      const bar = page.getByRole("navigation", { name: "Contact" });
      await expect(bar).toBeVisible();
      await expect(bar.getByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:+447456182265");
      await expect(bar.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/447456182265\?text=/);
      await expect(bar.getByRole("link", { name: /Quote/ })).toHaveAttribute("href", "/quote");
      const box = await bar.boundingBox();
      expect(box && Math.round(box.y + box.height)).toBe(small.height);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(bar).toBeInViewport();
      await expectNoHorizontalScroll(page);
    });
  }

  test("the sticky bar does not cover the end of the footer", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bar = await page.getByRole("navigation", { name: "Contact" }).boundingBox();
    const footer = await page.getByRole("contentinfo").boundingBox();
    expect(bar && footer).toBeTruthy();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y + 1);
  });

  test("the menu opens and closes by tap", async ({ page, hasTouch }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Menu" });
    const menu = page.locator("#mobile-menu");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();
    await press(button, hasTouch);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/services");
    await expect(menu.getByRole("link", { name: "Get a quote" })).toHaveAttribute("href", "/quote");
    await expectTapTargets(page, "#mobile-menu a");
    await expectNoHorizontalScroll(page);
    await press(button, hasTouch);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();
  });

  test("the menu opens and closes by keyboard", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Menu" });
    const menu = page.locator("#mobile-menu");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(menu.getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Space");
    await expect(menu).toBeHidden();
  });

  test("header, footer and bar links are at least 44px", async ({ page }) => {
    await page.goto("/");
    await expectTapTargets(page, "header a, header button, footer a, [aria-label=Contact] a");
  });
});

test.describe("at 1024px", () => {
  test.use({ viewport: large });

  test("shows the full navigation and hides the menu button and contact bar", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav).toBeVisible();
    for (const [name, href] of [
      ["Services", "/services"],
      ["Projects", "/projects"],
      ["About", "/about"],
      ["Areas", "/areas"],
    ]) {
      await expect(nav.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    await expect(page.getByRole("banner").getByRole("link", { name: "Get a quote" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Contact" })).toBeHidden();
    await expectNoHorizontalScroll(page);
  });
});

test("the footer links to every top-level and service page", async ({ page }) => {
  await page.goto("/quote");
  const footer = page.getByRole("contentinfo");
  for (const href of [
    "/",
    "/services",
    "/services/plastering",
    "/services/painting-and-decorating",
    "/services/gardening-and-landscaping",
    "/projects",
    "/about",
    "/areas",
    "/quote",
    "/privacy",
  ]) {
    await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
  }
  await expect(footer.getByRole("link", { name: "07456 182265" })).toHaveAttribute("href", "tel:+447456182265");
});

test("marks the current page in the navigation", async ({ page }) => {
  await page.goto("/quote");
  await expect(page.getByRole("contentinfo").locator('a[href="/quote"][aria-current="page"]')).toHaveCount(1);
});

test("the header, footer and contact bar speak as we, without naming Darren", async ({ page }) => {
  await page.setViewportSize(small);
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const part of [page.getByRole("banner"), footer, page.getByRole("navigation", { name: "Contact" })]) {
    expect(await part.innerText()).not.toMatch(/Darren|\b(he|him|his)\b/i);
  }
  const links = [
    footer.getByRole("link", { name: "WhatsApp us" }),
    page.getByRole("navigation", { name: "Contact" }).getByRole("link", { name: /WhatsApp/ }),
  ];
  for (const link of links) {
    const href = (await link.getAttribute("href")) ?? "";
    expect(new URL(href).searchParams.get("text")).toBe("Hi, I'd like a quote please.");
  }
});

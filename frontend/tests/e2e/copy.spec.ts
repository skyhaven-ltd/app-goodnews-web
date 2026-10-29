import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const banned =
  /\b(actually|additionally|align(s|ed)? with|crucial|delve[sd]?|emphasi[sz]ing|enduring|enhanc(e|es|ed|ing)|foster(s|ed|ing)?|garner(s|ed)?|interplay|intricate|intricacies|pivotal|showcas(e|es|ed|ing)|tapestry|testament|underscor(e|es|ed|ing)|valuable|vibrant|seamless(ly)?|nestled|boasts?|elevat(e|es|ed|ing)|meticulous(ly)?|unparalleled|furthermore|moreover|realm|robust|game[- ]changer|cutting[- ]edge|in today's)\b/i;

const darrenPages = new Set(["/about", "/privacy"]);

async function sitemapPaths(request: APIRequestContext) {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
}

async function pageCopy(page: Page) {
  const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
  return [await page.title(), description, await page.locator("body").innerText()].join("\n");
}

function expectCleanCopy(copy: string, label: string) {
  expect(copy, `${label} em dash`).not.toContain(String.fromCharCode(0x2014));
  expect(copy.match(banned)?.[0], `${label} banned word`).toBeUndefined();
}

async function fillForm(page: Page) {
  await page.getByLabel("Your name").fill("Jane Smith");
  await page.getByLabel("Phone number").fill("07700 900123");
  await page.getByLabel("Postcode").fill("B91 3QJ");
  await page.locator("#quote-form").getByText("Plastering", { exact: true }).click();
  await page.getByLabel("About the job").fill("Skim two ceilings and fill the cracks.");
}

test("every page has plain copy and names Darren only on the about and privacy pages", async ({ page, request }) => {
  const paths = [...(await sitemapPaths(request)), "/no-such-page"];
  expect(paths).toEqual(expect.arrayContaining(["/", "/about", "/privacy", "/quote"]));
  for (const path of paths) {
    await page.goto(path);
    const copy = await pageCopy(page);
    expectCleanCopy(copy, path);
    if (!darrenPages.has(path)) {
      expect(copy, `${path} names Darren`).not.toContain("Darren");
    }
  }
});

test("the quote form errors and panels have plain copy without naming Darren", async ({ page }) => {
  await page.goto("/quote");
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  const errors = await page.locator("#quote-form").innerText();
  expectCleanCopy(errors, "form errors");
  expect(errors).not.toContain("Darren");

  await page.route("/api/quote", (route) => route.fulfill({ status: 502, contentType: "application/json", body: "{}" }));
  await fillForm(page);
  await page.getByRole("button", { name: "Get my quote" }).click();
  const fallback = page.getByTestId("quote-fallback");
  await expect(fallback).toBeVisible();
  const fallbackCopy = await fallback.innerText();
  expectCleanCopy(fallbackCopy, "fallback panel");
  expect(fallbackCopy).not.toContain("Darren");

  await page.unroute("/api/quote");
  await page.route("/api/quote", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }),
  );
  await page.getByRole("button", { name: "Get my quote" }).click();
  const success = page.getByTestId("quote-success");
  await expect(success).toBeVisible();
  const successCopy = await success.innerText();
  expectCleanCopy(successCopy, "thank-you panel");
  expect(successCopy).not.toContain("Darren");
});

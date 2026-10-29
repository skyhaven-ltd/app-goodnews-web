import { expect, test, type Page } from "@playwright/test";
import { buildSmsUrl, buildWhatsAppUrl, FIELD_LIMITS, formatQuoteMessage } from "../../src/lib/quote";

const details = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "b91 3qj",
  service: "Plastering",
  description: "Skim two ceilings & fill cracks (about 20m²).",
} as const;

const quote = { ...details, postcode: "B91 3QJ", preferredContact: "whatsapp" } as const;

async function fillForm(page: Page, description: string = details.description) {
  await page.getByLabel("Your name").fill(details.name);
  await page.getByLabel("Phone number").fill(details.phone);
  await page.getByLabel("Postcode").fill(details.postcode);
  await page.locator("#quote-form").getByText(details.service, { exact: true }).click();
  await page.getByLabel("About the job").fill(description);
}

function trackRequests(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => urls.push(request.url()));
  return urls;
}

async function expectDetailsKept(page: Page, description: string = details.description) {
  await expect(page.getByLabel("Your name")).toHaveValue(details.name);
  await expect(page.getByLabel("Phone number")).toHaveValue(details.phone);
  await expect(page.getByLabel("Postcode")).toHaveValue(details.postcode);
  await expect(page.getByRole("radio", { name: details.service })).toBeChecked();
  await expect(page.getByLabel("About the job")).toHaveValue(description);
}

async function expectFallbacks(page: Page) {
  const fallback = page.getByTestId("quote-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toBeFocused();
  await expect(fallback).toContainText("didn't send");
  const message = formatQuoteMessage(quote);
  await expect(fallback.getByRole("link", { name: "Send on WhatsApp" })).toHaveAttribute(
    "href",
    buildWhatsAppUrl("447456182265", message),
  );
  await expect(fallback.getByRole("link", { name: "Send as a text" })).toHaveAttribute(
    "href",
    buildSmsUrl("+447456182265", message),
  );
  await expect(fallback.getByRole("link", { name: /07456 182265/ })).toHaveAttribute("href", "tel:+447456182265");
  await expect(page.getByTestId("quote-success")).toBeHidden();
  await expectDetailsKept(page);
}

const ok = { status: 200, contentType: "application/json", body: '{"ok":true}' };

test.beforeEach(async ({ page }) => {
  await page.goto("/quote");
});

test("has one main button and asks how we should get back to you", async ({ page }) => {
  const form = page.locator("#quote-form");
  await expect(form.getByRole("button")).toHaveCount(1);
  await expect(form.getByRole("button", { name: "Get my quote" })).toHaveAttribute("type", "submit");
  const group = form.getByRole("group", { name: "How should we get back to you?" });
  await expect(group.getByRole("radio")).toHaveCount(3);
  await expect(group.getByRole("radio", { name: "WhatsApp" })).toBeChecked();
  await expect(group.getByRole("radio", { name: "Call" })).not.toBeChecked();
  await expect(group.getByRole("radio", { name: "Text" })).not.toBeChecked();
  await expect(page.getByTestId("quote-success")).toBeHidden();
  await expect(page.getByTestId("quote-fallback")).toBeHidden();
});

test("posts the quote as JSON and shows the thank-you panel", async ({ page }) => {
  let body: Record<string, unknown> | undefined;
  let contentType: string | undefined;
  await page.route("/api/quote", async (route) => {
    body = route.request().postDataJSON();
    contentType = route.request().headers()["content-type"];
    await route.fulfill(ok);
  });
  await fillForm(page);
  await page.locator("#quote-form").getByText("Text", { exact: true }).click();
  await page.getByRole("button", { name: "Get my quote" }).click();
  const success = page.getByTestId("quote-success");
  await expect(success).toBeVisible();
  await expect(success).toBeFocused();
  await expect(success).toContainText("We'll get back to you by text");
  await expect(page.getByTestId("quote-fallback")).toBeHidden();
  expect(contentType).toBe("application/json");
  expect(body).toMatchObject({ ...quote, preferredContact: "text", website: "" });
  expect(typeof body?.elapsedMs).toBe("number");
  expect(body?.elapsedMs as number).toBeGreaterThanOrEqual(0);
  const photos = success.getByRole("link", { name: "Send photos on WhatsApp" });
  const href = (await photos.getAttribute("href")) ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/447456182265\?text=/);
  const text = new URL(href).searchParams.get("text") ?? "";
  expect(text).toContain("Plastering");
  expect(text).toContain("B91 3QJ");
  expect(text).toContain("photos");
  expect(text).not.toContain("Darren");
  await expect(page.getByLabel("Your name")).toHaveValue("");
  await expect(page.getByRole("radio", { name: "WhatsApp" })).toBeChecked();
});

for (const [contact, wording] of [
  ["WhatsApp", "on WhatsApp"],
  ["Call", "with a call"],
] as const) {
  test(`thanks the customer and says we'll reply ${wording}`, async ({ page }) => {
    await page.route("/api/quote", (route) => route.fulfill(ok));
    await fillForm(page);
    await page.locator("#quote-form").getByText(contact, { exact: true }).click();
    await page.getByRole("button", { name: "Get my quote" }).click();
    await expect(page.getByTestId("quote-success")).toContainText(`We'll get back to you ${wording}`);
  });
}

for (const status of [400, 502, 503]) {
  test(`shows the fallbacks with details kept on a ${status} response`, async ({ page }) => {
    await page.route("/api/quote", (route) => route.fulfill({ status, contentType: "application/json", body: '{"ok":false}' }));
    await fillForm(page);
    await page.getByRole("button", { name: "Get my quote" }).click();
    await expectFallbacks(page);
  });
}

test("shows the fallbacks when the request is aborted", async ({ page }) => {
  await page.route("/api/quote", (route) => route.abort("failed"));
  await fillForm(page);
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expectFallbacks(page);
});

test("shows the fallbacks when the request times out", async ({ page }) => {
  await page.route("/api/quote", () => {});
  await page.locator("form#quote-form").evaluate((form) => form.setAttribute("data-timeout", "500"));
  await fillForm(page);
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByRole("button", { name: /Sending/ })).toBeDisabled();
  await expectFallbacks(page);
  await expect(page.getByRole("button", { name: "Get my quote" })).toBeEnabled();
});

test("carries a full-length description in the fallback links", async ({ page }) => {
  await page.route("/api/quote", (route) => route.abort("failed"));
  const description = "a".repeat(FIELD_LIMITS.description);
  await fillForm(page, description);
  await page.getByRole("button", { name: "Get my quote" }).click();
  const link = page.getByTestId("quote-fallback").getByRole("link", { name: "Send on WhatsApp" });
  await expect(link).toBeVisible();
  const href = (await link.getAttribute("href")) ?? "";
  expect(new URL(href).searchParams.get("text")).toContain(description);
  expect(href.length).toBeLessThan(8192);
  await expectDetailsKept(page, description);
});

test("shows errors and sends nothing when submitted empty", async ({ page }) => {
  const requests = trackRequests(page);
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please enter your phone number.")).toBeVisible();
  await expect(page.getByText("Please enter your postcode.")).toBeVisible();
  await expect(page.getByText("Please choose a service.")).toBeVisible();
  await expect(page.getByText("Please describe the job.")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Your name")).toBeFocused();
  await expect(page).toHaveURL(/\/quote\/?$/);
  expect(requests.filter((url) => url.includes("/api/") || url.includes("wa.me"))).toEqual([]);
});

test("rejects an invalid phone and postcode", async ({ page }) => {
  let apiCalls = 0;
  await page.route("/api/quote", (route) => {
    apiCalls += 1;
    return route.fulfill(ok);
  });
  await fillForm(page);
  await page.getByLabel("Phone number").fill("12345");
  await page.getByLabel("Postcode").fill("nowhere");
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByText("Please enter a UK phone number", { exact: false })).toBeVisible();
  await expect(page.getByText("Please enter a full UK postcode", { exact: false })).toBeVisible();
  await expect(page.getByText("Please enter your name.")).toBeHidden();
  await expect(page.getByLabel("Phone number")).toBeFocused();
  expect(apiCalls).toBe(0);
  await page.getByLabel("Phone number").fill(details.phone);
  await page.getByLabel("Postcode").fill(details.postcode);
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByTestId("quote-success")).toBeVisible();
  await expect(page.getByText("Please enter a UK phone number", { exact: false })).toBeHidden();
  expect(apiCalls).toBe(1);
});

test("shows a call link", async ({ page }) => {
  await expect(page.locator("#quote-form").getByRole("link", { name: /call 07456 182265/i })).toHaveAttribute(
    "href",
    "tel:+447456182265",
  );
});

test("uses mobile friendly inputs and a hidden honeypot", async ({ page }) => {
  await expect(page.getByLabel("Your name")).toHaveAttribute("autocomplete", "name");
  await expect(page.getByLabel("Phone number")).toHaveAttribute("type", "tel");
  await expect(page.getByLabel("Phone number")).toHaveAttribute("autocomplete", "tel");
  await expect(page.getByLabel("Postcode")).toHaveAttribute("autocomplete", "postal-code");
  const sizes = await page
    .locator("#quote-form input:not([type=radio]):not([name=website]), #quote-form textarea")
    .evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
  expect(sizes.length).toBe(4);
  for (const size of sizes) {
    expect(size).toBeGreaterThanOrEqual(16);
  }
  const honeypot = page.locator("#quote-form input[name=website]");
  await expect(honeypot).toHaveAttribute("tabindex", "-1");
  await expect(honeypot).toHaveAttribute("autocomplete", "off");
  await expect(honeypot).not.toBeInViewport();
  await expect(page.getByLabel("Your name")).toBeInViewport();
});

async function expectTapTargets(page: Page, selector: string) {
  const boxes = await page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: element.textContent?.trim() || element.getAttribute("name"), width: rect.width, height: rect.height };
      }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.height, `${box.label} height`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${box.label} width`).toBeGreaterThanOrEqual(44);
  }
}

test("tap targets are at least 44px", async ({ page }) => {
  await expectTapTargets(
    page,
    "#quote a, #quote button, #quote label:has(input[type=radio]), #quote input:not([type=radio]):not([name=website]), #quote textarea",
  );
  await page.route("/api/quote", (route) => route.fulfill({ status: 502, body: "{}" }));
  await fillForm(page);
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByTestId("quote-fallback")).toBeVisible();
  await expectTapTargets(page, "[data-testid=quote-fallback] a");
});

test("thank-you panel links are at least 44px", async ({ page }) => {
  await page.route("/api/quote", (route) => route.fulfill(ok));
  await fillForm(page);
  await page.getByRole("button", { name: "Get my quote" }).click();
  await expect(page.getByTestId("quote-success")).toBeVisible();
  await expectTapTargets(page, "[data-testid=quote-success] a");
});

import { expect, test, type Page } from "@playwright/test";
import { buildWhatsAppUrl, formatQuoteMessage } from "../../src/lib/quote";

const details = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "b91 3qj",
  service: "Plastering",
  description: "Skim two ceilings & fill cracks (about 20m²).",
} as const;

async function fillForm(page: Page) {
  await page.getByLabel("Your name").fill(details.name);
  await page.getByLabel("Phone number").fill(details.phone);
  await page.getByLabel("Postcode").fill(details.postcode);
  await page.locator("#quote-form").getByText(details.service, { exact: true }).click();
  await page.getByLabel("About the job").fill(details.description);
}

async function expectDetailsKept(page: Page) {
  await expect(page.getByLabel("Your name")).toHaveValue(details.name);
  await expect(page.getByLabel("Phone number")).toHaveValue(details.phone);
  await expect(page.getByLabel("Postcode")).toHaveValue(details.postcode);
  await expect(page.getByRole("radio", { name: details.service })).toBeChecked();
  await expect(page.getByLabel("About the job")).toHaveValue(details.description);
}

async function expectFallbacks(page: Page) {
  const fallback = page.getByTestId("quote-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText("couldn't send");
  const whatsapp = fallback.getByRole("link", { name: /WhatsApp/ });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/447456182265\?text=/);
  expect(decodeURIComponent((await whatsapp.getAttribute("href")) ?? "")).toContain(details.name);
  const sms = fallback.getByRole("link", { name: /Text/ });
  await expect(sms).toHaveAttribute("href", /^sms:\+447456182265\?body=/);
  expect(decodeURIComponent((await sms.getAttribute("href")) ?? "")).toContain(details.description);
  await expect(fallback.getByRole("link", { name: /07456 182265/ })).toHaveAttribute("href", "tel:+447456182265");
  await expect(page.getByTestId("quote-success")).toBeHidden();
  await expectDetailsKept(page);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/quote");
});

test("shows a confirmation when the request is sent", async ({ page }) => {
  let body: Record<string, unknown> | undefined;
  await page.route("/api/quote", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await fillForm(page);
  await page.getByRole("button", { name: "Send request" }).click();
  const success = page.getByTestId("quote-success");
  await expect(success).toBeVisible();
  await expect(success).toContainText("Darren will reply by WhatsApp or phone");
  await expect(page.getByTestId("quote-fallback")).toBeHidden();
  expect(body).toMatchObject({ ...details, postcode: "B91 3QJ", website: "" });
  expect(typeof body?.startedAt).toBe("number");
});

for (const status of [500, 503, 400]) {
  test(`shows the fallbacks with details kept on a ${status} response`, async ({ page }) => {
    await page.route("/api/quote", (route) => route.fulfill({ status, body: "{}" }));
    await fillForm(page);
    await page.getByRole("button", { name: "Send request" }).click();
    await expectFallbacks(page);
  });
}

test("shows the fallbacks when the request times out", async ({ page }) => {
  await page.route("/api/quote", () => {});
  await page.locator("form#quote-form").evaluate((form) => form.setAttribute("data-timeout", "500"));
  await fillForm(page);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("button", { name: /Sending/ })).toBeDisabled();
  await expectFallbacks(page);
  await expect(page.getByRole("button", { name: "Send request" })).toBeEnabled();
});

test("shows the fallbacks when the network fails", async ({ page }) => {
  await page.route("/api/quote", (route) => route.abort("failed"));
  await fillForm(page);
  await page.getByRole("button", { name: "Send request" }).click();
  await expectFallbacks(page);
});

test("opens WhatsApp with the details prefilled", async ({ page }) => {
  let apiCalls = 0;
  await page.route("/api/quote", (route) => {
    apiCalls += 1;
    return route.fulfill({ status: 200, body: "{}" });
  });
  await page.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>WhatsApp</p>" }));
  await fillForm(page);
  const request = page.waitForRequest(/^https:\/\/wa\.me\//);
  await page.getByRole("button", { name: "Message Darren on WhatsApp" }).click();
  const expected = buildWhatsAppUrl(
    "447456182265",
    formatQuoteMessage({ ...details, postcode: "B91 3QJ" }, "Hi Darren, I'd like a quote."),
  );
  const actual = new URL((await request).url());
  expect(actual.origin + actual.pathname).toBe("https://wa.me/447456182265");
  const text = actual.searchParams.get("text") ?? "";
  expect(text).toBe(new URL(expected).searchParams.get("text"));
  expect(text).toContain("Name: Jane Smith");
  expect(text).toContain("Phone: 07700 900123");
  expect(text).toContain("Postcode: B91 3QJ");
  expect(text).toContain("Service: Plastering");
  expect(text).toContain("Skim two ceilings & fill cracks (about 20m²).");
  expect(apiCalls).toBe(0);
});

test("shows errors and sends nothing when submitted empty", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please enter your phone number.")).toBeVisible();
  await expect(page.getByText("Please enter your postcode.")).toBeVisible();
  await expect(page.getByText("Please choose a service.")).toBeVisible();
  await expect(page.getByText("Please describe the job.")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Your name")).toBeFocused();
  await page.getByRole("button", { name: "Message Darren on WhatsApp" }).click();
  await expect(page).toHaveURL(/\/quote\/?$/);
  expect(requests.filter((url) => url.includes("/api/quote") || url.includes("wa.me"))).toEqual([]);
});

test("rejects an invalid phone and postcode", async ({ page }) => {
  let apiCalls = 0;
  await page.route("/api/quote", (route) => {
    apiCalls += 1;
    return route.fulfill({ status: 200, body: "{}" });
  });
  await fillForm(page);
  await page.getByLabel("Phone number").fill("12345");
  await page.getByLabel("Postcode").fill("nowhere");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Please enter a UK phone number", { exact: false })).toBeVisible();
  await expect(page.getByText("Please enter a full UK postcode", { exact: false })).toBeVisible();
  await expect(page.getByText("Please enter your name.")).toBeHidden();
  await expect(page.getByLabel("Phone number")).toBeFocused();
  expect(apiCalls).toBe(0);
  await page.getByLabel("Phone number").fill(details.phone);
  await page.getByLabel("Postcode").fill(details.postcode);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("quote-success")).toBeVisible();
  await expect(page.getByText("Please enter a UK phone number", { exact: false })).toBeHidden();
  expect(apiCalls).toBe(1);
});

test("uses mobile friendly inputs", async ({ page }) => {
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
  await page.route("/api/quote", (route) => route.fulfill({ status: 500, body: "{}" }));
  await fillForm(page);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByTestId("quote-fallback")).toBeVisible();
  await expectTapTargets(page, "[data-testid=quote-fallback] a");
});

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

async function stubWhatsApp(page: Page) {
  await page.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<p>WhatsApp</p>" }),
  );
}

async function captureSms(page: Page) {
  await page.evaluate(() => {
    const opened: string[] = [];
    (window as unknown as { openedSms: string[] }).openedSms = opened;
    window.addEventListener("click", (event) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href^='sms:']");
      if (link && !event.defaultPrevented) {
        opened.push(link.getAttribute("href") ?? "");
        event.preventDefault();
      }
    });
  });
}

function openedSms(page: Page) {
  return page.evaluate(() => (window as unknown as { openedSms: string[] }).openedSms);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/quote");
});

test("opens WhatsApp with the message ready", async ({ page }) => {
  const requests = trackRequests(page);
  await stubWhatsApp(page);
  await fillForm(page);
  const request = page.waitForRequest(/^https:\/\/wa\.me\//);
  await page.getByRole("button", { name: "Send on WhatsApp" }).click();
  const actual = new URL((await request).url());
  expect(actual.origin + actual.pathname).toBe("https://wa.me/447456182265");
  const text = actual.searchParams.get("text") ?? "";
  expect(text).toBe(new URL(buildWhatsAppUrl("447456182265", formatQuoteMessage(quote))).searchParams.get("text"));
  expect(text).toContain("Name: Jane Smith");
  expect(text).toContain("Phone: 07700 900123");
  expect(text).toContain("Postcode: B91 3QJ");
  expect(text).toContain("Service: Plastering");
  expect(text).toContain("Skim two ceilings & fill cracks (about 20m²).");
  expect(text).not.toContain("Darren");
  expect(requests.filter((url) => url.includes("/api/"))).toEqual([]);
});

test("opens WhatsApp with a full-length description", async ({ page }) => {
  await stubWhatsApp(page);
  const description = "a".repeat(FIELD_LIMITS.description);
  await fillForm(page, description);
  const request = page.waitForRequest(/^https:\/\/wa\.me\//);
  await page.getByRole("button", { name: "Send on WhatsApp" }).click();
  const url = (await request).url();
  expect(new URL(url).searchParams.get("text")).toContain(description);
  expect(url.length).toBeLessThan(8192);
});

test("opens a text message with the same message", async ({ page }) => {
  const requests = trackRequests(page);
  await captureSms(page);
  await fillForm(page);
  await page.getByRole("link", { name: "Send as a text" }).click();
  await expect.poll(() => openedSms(page)).toEqual([buildSmsUrl("+447456182265", formatQuoteMessage(quote))]);
  expect(requests.filter((url) => url.includes("/api/") || url.includes("wa.me"))).toEqual([]);
});

test("shows a call link", async ({ page }) => {
  await expect(page.locator("#quote-form").getByRole("link", { name: /call 07456 182265/i })).toHaveAttribute(
    "href",
    "tel:+447456182265",
  );
});

test("explains that WhatsApp opens with the message ready for photos", async ({ page }) => {
  const hint = page.getByTestId("quote-send-hint");
  await expect(hint).toBeVisible();
  await expect(hint).toContainText("WhatsApp opens with your message ready");
  await expect(hint).toContainText("photos");
  await expect(page.getByRole("button", { name: "Send on WhatsApp" })).toHaveAttribute(
    "aria-describedby",
    "quote-send-hint",
  );
});

test("shows errors and opens nothing when submitted empty", async ({ page }) => {
  const requests = trackRequests(page);
  await captureSms(page);
  await page.getByRole("button", { name: "Send on WhatsApp" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please enter your phone number.")).toBeVisible();
  await expect(page.getByText("Please enter your postcode.")).toBeVisible();
  await expect(page.getByText("Please choose a service.")).toBeVisible();
  await expect(page.getByText("Please describe the job.")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Your name")).toBeFocused();
  await page.getByRole("link", { name: "Send as a text" }).click();
  await expect(page.getByLabel("Your name")).toBeFocused();
  await expect(page).toHaveURL(/\/quote\/?$/);
  expect(await openedSms(page)).toEqual([]);
  expect(requests.filter((url) => url.includes("/api/") || url.includes("wa.me"))).toEqual([]);
});

test("rejects an invalid phone and postcode", async ({ page }) => {
  await stubWhatsApp(page);
  const requests = trackRequests(page);
  await fillForm(page);
  await page.getByLabel("Phone number").fill("12345");
  await page.getByLabel("Postcode").fill("nowhere");
  await page.getByRole("button", { name: "Send on WhatsApp" }).click();
  await expect(page.getByText("Please enter a UK phone number", { exact: false })).toBeVisible();
  await expect(page.getByText("Please enter a full UK postcode", { exact: false })).toBeVisible();
  await expect(page.getByText("Please enter your name.")).toBeHidden();
  await expect(page.getByLabel("Phone number")).toBeFocused();
  expect(requests.filter((url) => url.includes("wa.me"))).toEqual([]);
  await page.getByLabel("Phone number").fill(details.phone);
  await page.getByLabel("Postcode").fill(details.postcode);
  const request = page.waitForRequest(/^https:\/\/wa\.me\//);
  await page.getByRole("button", { name: "Send on WhatsApp" }).click();
  expect(new URL((await request).url()).searchParams.get("text")).toContain("Postcode: B91 3QJ");
});

test("has no server send path left", async ({ page }) => {
  await expect(page.locator("#quote-form input[name=website]")).toHaveCount(0);
  await expect(page.getByTestId("quote-success")).toHaveCount(0);
  await expect(page.getByTestId("quote-fallback")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send request" })).toHaveCount(0);
});

test("uses mobile friendly inputs", async ({ page }) => {
  await expect(page.getByLabel("Your name")).toHaveAttribute("autocomplete", "name");
  await expect(page.getByLabel("Phone number")).toHaveAttribute("type", "tel");
  await expect(page.getByLabel("Phone number")).toHaveAttribute("autocomplete", "tel");
  await expect(page.getByLabel("Postcode")).toHaveAttribute("autocomplete", "postal-code");
  const sizes = await page
    .locator("#quote-form input:not([type=radio]), #quote-form textarea")
    .evaluateAll((elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
  expect(sizes.length).toBe(4);
  for (const size of sizes) {
    expect(size).toBeGreaterThanOrEqual(16);
  }
  await expect(page.getByLabel("Your name")).toBeInViewport();
});

test("tap targets are at least 44px", async ({ page }) => {
  const boxes = await page
    .locator("#quote a, #quote button, #quote label:has(input[type=radio]), #quote input:not([type=radio]), #quote textarea")
    .evaluateAll((elements) =>
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
});

import { expect, test } from "@playwright/test";

const providers = /callmebot|twilio|vonage|messagebird|bird\.com|sinch|infobip|ultramsg|green-?api|360dialog|textmagic|whatsapp business api|cloud api/i;

test("the privacy page explains the WhatsApp, text and phone routes, storage and deletion", async ({ page }) => {
  const response = await page.goto("/privacy");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/privacy/i);
  const main = page.locator("main");
  const text = await main.innerText();
  expect(text).toContain("Darren Goodchild");
  expect(text).toContain("Send on WhatsApp");
  expect(text).toContain("Send as a text");
  expect(text).toMatch(/Meta/);
  expect(text).toMatch(/mobile network/i);
  expect(text).toMatch(/does not store|stores nothing|not stored/i);
  expect(text).toMatch(/delete/i);
  expect(text).not.toContain("Send request");
  expect(text).not.toMatch(/Azure Function/i);
  expect(text).not.toContain("[PLACEHOLDER]");
  expect(text).not.toContain("—");
  await expect(main.locator('a[href="tel:+447456182265"]').first()).toBeVisible();
  await expect(main.locator('a[href^="https://wa.me/447456182265"]').first()).toBeVisible();
  await expect(main.locator('a[href="mailto:dazlan73@gmail.com"]').first()).toBeVisible();
  expect(text).not.toMatch(providers);
  expect(await page.content()).not.toMatch(providers);
});

test("the footer shows the contact email", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo").locator('a[href="mailto:dazlan73@gmail.com"]')).toBeVisible();
});

test("the footer privacy link reaches the privacy page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").locator('a[href="/privacy"]').first().click();
  await expect(page).toHaveURL(/\/privacy$/);
});

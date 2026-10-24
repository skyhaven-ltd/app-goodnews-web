import { expect, test } from "@playwright/test";

const providers = /callmebot|twilio|vonage|messagebird|bird\.com|sinch|infobip|ultramsg|green-?api|360dialog|textmagic|whatsapp business api|cloud api/i;

test("the privacy page explains both quote routes, storage and deletion", async ({ page }) => {
  const response = await page.goto("/privacy");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/privacy/i);
  const main = page.locator("main");
  const text = await main.innerText();
  expect(text).toContain("Send request");
  expect(text).toMatch(/Azure Function/);
  expect(text).toContain("[PLACEHOLDER]");
  expect(text).toMatch(/Darren's WhatsApp/);
  expect(text).toMatch(/does not store|stores nothing|not stored/i);
  expect(text).toContain("Message Darren on WhatsApp");
  expect(text).toMatch(/your own WhatsApp/i);
  expect(text).toMatch(/delete/i);
  await expect(main.locator('a[href="tel:+447456182265"]').first()).toBeVisible();
  await expect(main.locator('a[href^="https://wa.me/447456182265"]').first()).toBeVisible();
  expect(text).not.toMatch(providers);
  expect(await page.content()).not.toMatch(providers);
});

test("the footer privacy link reaches the privacy page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").locator('a[href="/privacy"]').first().click();
  await expect(page).toHaveURL(/\/privacy$/);
});

import { expect, test } from "@playwright/test";

const icons = [
  { selector: 'link[rel="icon"][type="image/svg+xml"]', href: "/favicon.svg", type: "image/svg+xml" },
  { selector: 'link[rel="icon"][sizes="32x32"]', href: "/favicon.ico", type: "image/" },
  { selector: 'link[rel="apple-touch-icon"]', href: "/apple-touch-icon.png", type: "image/png" },
];

for (const path of ["/", "/quote", "/no-such-page"]) {
  test(`${path} links the trowel favicon and apple touch icon`, async ({ page }) => {
    await page.goto(path);
    for (const icon of icons) {
      await expect(page.locator(icon.selector)).toHaveAttribute("href", icon.href);
    }
  });
}

test("each icon URL serves an image", async ({ request }) => {
  for (const icon of icons) {
    const response = await request.get(icon.href);
    expect(response.status(), icon.href).toBe(200);
    expect(response.headers()["content-type"], icon.href).toContain(icon.type);
    expect((await response.body()).length, icon.href).toBeGreaterThan(100);
  }
});

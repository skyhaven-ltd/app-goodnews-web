import { expect, test, type APIRequestContext } from "@playwright/test";

async function sitemapUrls(request: APIRequestContext) {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("xml");
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

test("every page has a unique title and description, a canonical URL and Open Graph tags", async ({ page, request }) => {
  const pages = (await sitemapUrls(request)).map((url) => new URL(url).pathname);
  expect(pages).toEqual(expect.arrayContaining(["/", "/quote"]));
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(title.length).toBeGreaterThan(10);
    expect(description?.length ?? 0).toBeGreaterThan(50);
    titles.add(title);
    descriptions.add(description ?? "");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/^https:\/\//);
    expect(new URL(canonical ?? "").pathname).toBe(path);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical ?? "");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description ?? "");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_GB");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Good News Plastering");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(image).toMatch(/^https:\/\/.+\.jpg$/);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /.{10,}/);
    const local = await page.request.get(new URL(image ?? "").pathname);
    expect(local.ok()).toBe(true);
    expect(local.headers()["content-type"]).toContain("image/jpeg");
  }
  expect(titles.size).toBe(pages.length);
  expect(descriptions.size).toBe(pages.length);
});

test("the home page has LocalBusiness JSON-LD", async ({ page }) => {
  await page.goto("/");
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(scripts).toHaveLength(1);
  const data = JSON.parse(scripts[0]);
  expect(data["@context"]).toBe("https://schema.org");
  expect(data["@type"]).toBe("LocalBusiness");
  expect(data.name).toBe("Good News Plastering");
  expect(data.telephone).toBe("+447456182265");
  expect(data.url).toBe(await page.locator('link[rel="canonical"]').getAttribute("href"));
  expect(data.image).toBe(await page.locator('meta[property="og:image"]').getAttribute("content"));
  expect(data.areaServed.map((area: { name: string }) => area.name)).toEqual(["Birmingham", "Worcestershire", "Evesham"]);
});

test("the quote page has no JSON-LD", async ({ page }) => {
  await page.goto("/quote");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test("sitemap.xml lists every page by its canonical URL", async ({ page, request }) => {
  const urls = await sitemapUrls(request);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls.map((url) => new URL(url).pathname)).toEqual(expect.arrayContaining(["/", "/quote"]));
  for (const url of urls) {
    const response = await page.goto(new URL(url).pathname);
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
  }
  expect(urls.some((url) => url.includes("404"))).toBe(false);
});

test("robots.txt allows crawling and points at the sitemap", async ({ request, page }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text).toContain("User-agent: *");
  expect(text).toContain("Allow: /");
  await page.goto("/");
  const canonical = (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
  expect(text).toContain(`Sitemap: ${new URL("/sitemap.xml", canonical).href}`);
});

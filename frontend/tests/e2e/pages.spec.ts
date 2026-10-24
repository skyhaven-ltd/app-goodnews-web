import { expect, test, type APIRequestContext } from "@playwright/test";
import { builtFile, builtImages, pageImages } from "./built-files";

const widths = [360, 390, 1440];

async function sitePages(request: APIRequestContext) {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  expect(pages.length).toBeGreaterThanOrEqual(20);
  return [...pages, "/404.html"];
}

test("every link on every page resolves", async ({ page, request }) => {
  const pages = await sitePages(request);
  const targets = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const { local, missingAnchors } = await page.evaluate(() => {
      const local: string[] = [];
      const missingAnchors: string[] = [];
      for (const anchor of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
        const url = new URL(anchor.href);
        if (url.origin !== location.origin) continue;
        if (url.pathname === location.pathname && url.hash) {
          if (!document.getElementById(decodeURIComponent(url.hash.slice(1)))) missingAnchors.push(url.hash);
          continue;
        }
        local.push(url.pathname);
      }
      return { local, missingAnchors };
    });
    expect(missingAnchors, path).toEqual([]);
    for (const target of local) targets.add(target);
  }
  for (const path of pages) targets.delete(path);
  for (const target of targets) {
    const response = await request.get(target);
    expect(response.status(), target).toBe(200);
  }
});

test("no page claims free quotes or a single tradesman", async ({ request }) => {
  for (const path of await sitePages(request)) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toMatch(/free (quote|price)/i);
    expect(html, path).not.toMatch(/one tradesman/i);
  }
});

test("no page ships an image file over 300 KB", async ({ page, request }) => {
  const referenced = new Set<string>();
  for (const path of await sitePages(request)) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    for (const url of await pageImages(page)) referenced.add(url);
  }
  expect(referenced.size).toBeGreaterThan(100);
  for (const file of [...referenced].map(builtFile)) {
    expect(file.exists, file.path).toBe(true);
    expect(file.size, file.path).toBeLessThanOrEqual(300_000);
  }
});

test("the build has no image file over 300 KB", () => {
  const images = builtImages();
  expect(images.length).toBeGreaterThan(100);
  for (const file of images) {
    expect(file.size, file.path).toBeLessThanOrEqual(300_000);
  }
});

for (const width of widths) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("every page fits the screen without sideways scroll", async ({ page, request }) => {
      for (const path of await sitePages(request)) {
        await page.goto(path);
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
      }
    });

    if (width < 768) {
      test("every tap target is at least 44px and body text at least 16px", async ({ page, request }) => {
        for (const path of await sitePages(request)) {
          await page.goto(path);
          const { checked, small, tiny } = await page.evaluate(() => {
            const visible = (element: Element) => {
              if (element.closest("[aria-hidden=true], [hidden]")) return false;
              const rect = element.getBoundingClientRect();
              return rect.width > 1 && rect.height > 1 && rect.right > 0 && element.checkVisibility({ visibilityProperty: true });
            };
            let checked = 0;
            const small: string[] = [];
            const targets = document.querySelectorAll(
              'a[href], button, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea, summary, label:has(input[type=radio]), label:has(input[type=checkbox]), [tabindex="0"]',
            );
            for (const target of targets) {
              if (!visible(target)) continue;
              checked += 1;
              const rect = target.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44) {
                small.push(`${target.tagName} "${target.textContent?.trim().slice(0, 40)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`);
              }
            }
            const tiny: string[] = [];
            for (const element of document.querySelectorAll("body *")) {
              if (!visible(element)) continue;
              const style = getComputedStyle(element);
              const field = element.matches("input, select, textarea");
              const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
              if (!field && !(ownText && style.fontFamily.includes("Source Sans"))) continue;
              if (parseFloat(style.fontSize) < 16) {
                tiny.push(`${element.tagName} "${element.textContent?.trim().slice(0, 40)}" ${style.fontSize}`);
              }
            }
            return { checked, small, tiny };
          });
          expect(checked, path).toBeGreaterThan(5);
          expect(small, path).toEqual([]);
          expect(tiny, path).toEqual([]);
        }
      });
    }
  });
}

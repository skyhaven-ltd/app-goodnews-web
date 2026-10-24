import { describe, expect, it } from "vitest";
import { buildRobots, buildSitemap, pagePaths } from "./sitemap";

describe("pagePaths", () => {
  it("turns page files into clean URLs and skips error and private pages", async () => {
    const paths = await pagePaths({
      "./index.astro": {},
      "./quote.astro": {},
      "./404.astro": {},
      "./_draft.astro": {},
      "./services/index.astro": {},
      "./services/[slug].astro": {
        getStaticPaths: () => [{ params: { slug: "plastering" } }, { params: { slug: "painting-and-decorating" } }],
      },
      "./areas/[slug].astro": {
        getStaticPaths: async () => [{ params: { slug: "solihull" } }],
      },
    });
    expect(paths).toEqual([
      "/",
      "/areas/solihull",
      "/quote",
      "/services",
      "/services/painting-and-decorating",
      "/services/plastering",
    ]);
  });

  it("rejects a dynamic page without getStaticPaths", async () => {
    await expect(pagePaths({ "./areas/[slug].astro": {} })).rejects.toThrow("[slug]");
  });
});

describe("buildSitemap", () => {
  it("lists absolute URLs and escapes them", () => {
    const xml = buildSitemap("https://example.test", ["/", "/quote", "/a&b"]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<url><loc>https://example.test/</loc></url>");
    expect(xml).toContain("<url><loc>https://example.test/quote</loc></url>");
    expect(xml).toContain("<loc>https://example.test/a&amp;b</loc>");
  });
});

describe("buildRobots", () => {
  it("allows crawling and points at the sitemap", () => {
    expect(buildRobots("https://example.test")).toBe("User-agent: *\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n");
  });
});

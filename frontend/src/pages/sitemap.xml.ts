import type { APIRoute } from "astro";
import { buildSitemap, pagePaths, type PageModule } from "../lib/sitemap";

const pages = import.meta.glob<PageModule>("./**/*.astro", { eager: true });

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error("Set site in astro.config.mjs to build the sitemap");
  }
  return new Response(buildSitemap(site, await pagePaths(pages)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

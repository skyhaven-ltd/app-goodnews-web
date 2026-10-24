import type { APIRoute } from "astro";
import { buildRobots } from "../lib/sitemap";

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error("Set site in astro.config.mjs to build robots.txt");
  }
  return new Response(buildRobots(site), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

const site = globalThis.process?.env.SITE_URL || "https://goodnewsplastering.co.uk";
const e2eFixtures = globalThis.process?.env.E2E_FIXTURES === "1";

function fixtures() {
  return {
    name: "e2e-fixtures",
    hooks: {
      "astro:config:setup": ({ injectRoute }) => {
        injectRoute({ pattern: "/e2e/before-after", entrypoint: "./tests/fixtures/before-after.astro" });
        injectRoute({ pattern: "/e2e/testimonials", entrypoint: "./tests/fixtures/testimonials.astro" });
      },
    },
  };
}

export default defineConfig({
  site,
  output: "static",
  integrations: e2eFixtures ? [fixtures()] : [],
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [tailwindcss()],
  },
});

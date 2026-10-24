import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

const site = "https://good-news-plastering.invalid";

export default defineConfig({
  site,
  output: "static",
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [tailwindcss()],
  },
});

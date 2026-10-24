import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [tailwindcss()],
  },
});

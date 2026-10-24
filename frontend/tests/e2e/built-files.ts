import type { Page } from "@playwright/test";

interface FileSystem {
  existsSync(path: URL): boolean;
  statSync(path: URL): { size: number };
  readdirSync(path: URL, options: { recursive: true }): string[];
}

const fs = (globalThis as unknown as { process: { getBuiltinModule(id: "node:fs"): FileSystem } }).process.getBuiltinModule("node:fs");
const dist = new URL("../../dist/", import.meta.url);

export const imagePattern = /\.(avif|webp|jpe?g|png|gif|svg)$/i;

export function builtFile(path: string) {
  const file = new URL(`.${decodeURIComponent(path)}`, dist);
  return { path, exists: fs.existsSync(file), size: fs.existsSync(file) ? fs.statSync(file).size : 0 };
}

export function builtImages() {
  return fs
    .readdirSync(dist, { recursive: true })
    .map((name) => `/${name.replaceAll("\\", "/")}`)
    .filter((path) => imagePattern.test(path))
    .map(builtFile);
}

export async function pageImages(page: Page, scope = "html") {
  return page.locator(scope).evaluate((root) => {
    const found = new Set<string>();
    for (const element of root.querySelectorAll("img, source")) {
      const src = element.getAttribute("src");
      if (src) found.add(new URL(src, location.href).pathname);
      for (const candidate of (element.getAttribute("srcset") ?? "").split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) found.add(new URL(url, location.href).pathname);
      }
    }
    const og = root.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (og) found.add(new URL(og).pathname);
    return [...found];
  });
}

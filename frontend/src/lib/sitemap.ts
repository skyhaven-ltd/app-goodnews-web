export interface PageModule {
  getStaticPaths?: () => unknown;
}

interface StaticPath {
  params: Record<string, string | number | undefined>;
}

const SKIPPED = new Set(["404", "500"]);

function toPath(segments: string[]): string {
  return `/${segments.filter(Boolean).join("/")}`;
}

export async function pagePaths(modules: Record<string, PageModule>): Promise<string[]> {
  const paths = new Set<string>();
  for (const [file, module] of Object.entries(modules)) {
    const segments = file.replace(/^\.\//, "").replace(/\.astro$/, "").split("/");
    if (segments.at(-1) === "index") {
      segments.pop();
    }
    if (segments.some((segment) => segment.startsWith("_") || SKIPPED.has(segment))) {
      continue;
    }
    if (!segments.some((segment) => segment.includes("["))) {
      paths.add(toPath(segments));
      continue;
    }
    if (!module.getStaticPaths) {
      throw new Error(`${file} has no getStaticPaths`);
    }
    const entries = (await module.getStaticPaths()) as StaticPath[];
    for (const { params } of entries) {
      paths.add(
        toPath(segments.map((segment) => segment.replace(/\[(?:\.\.\.)?(\w+)\]/g, (_, name: string) => String(params[name] ?? "")))),
      );
    }
  }
  return [...paths].sort();
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function buildSitemap(site: string | URL, paths: string[]): string {
  const urls = paths.map((path) => `<url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function buildRobots(site: string | URL): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", site).href}\n`;
}

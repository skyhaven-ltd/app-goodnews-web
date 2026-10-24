export interface NavLink {
  href: string;
  label: string;
}

export const homeLink: NavLink = { href: "/", label: "Home" };

export const quoteLink: NavLink = { href: "/quote", label: "Get a quote" };

export const mainNav: NavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/areas", label: "Areas" },
];

export const serviceNav: NavLink[] = [
  { href: "/services/plastering", label: "Plastering" },
  { href: "/services/painting-and-decorating", label: "Painting & Decorating" },
  { href: "/services/gardening-and-landscaping", label: "Gardening & Landscaping" },
];

export const legalNav: NavLink[] = [{ href: "/privacy", label: "Privacy" }];

export function normalisePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function isCurrent(href: string, path: string): boolean {
  return normalisePath(href) === normalisePath(path);
}

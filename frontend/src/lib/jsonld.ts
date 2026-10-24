import { PLACEHOLDER, business } from "../data/business";
import { QUOTE_SERVICES } from "./quote";

export const DEFAULT_AREAS = ["Birmingham", "Worcestershire", "Evesham"];

export interface LocalBusinessOptions {
  site: string | URL;
  page?: string | URL;
  areas?: readonly string[];
  image?: string;
  description?: string;
}

export function buildLocalBusiness(options: LocalBusinessOptions): Record<string, unknown> {
  const home = new URL("/", options.site).href;
  const email: string = business.email;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${home}#business`,
    name: business.name,
    url: home,
    telephone: business.phone.tel,
    ...(email !== PLACEHOLDER && { email }),
    founder: { "@type": "Person", name: business.owner },
    address: { "@type": "PostalAddress", addressCountry: "GB" },
    areaServed: (options.areas ?? DEFAULT_AREAS).map((name) => ({ "@type": "Place", name })),
    knowsAbout: QUOTE_SERVICES.filter((service) => service !== "Other"),
    ...(options.page && { mainEntityOfPage: new URL(options.page).href }),
    ...(options.image && { image: options.image }),
    ...(options.description && { description: options.description }),
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

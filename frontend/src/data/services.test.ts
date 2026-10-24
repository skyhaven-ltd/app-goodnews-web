import { describe, expect, it } from "vitest";
import { QUOTE_SERVICES } from "../lib/quote";
import { serviceNav } from "./navigation";
import { leadServices, secondaryServices, serviceHref } from "./services";

const banned = /insured|accredit|guarantee|review|award|certified|approved|best in|number one|no\.? ?1|started with|most of his work/i;

describe("services", () => {
  it("gives the lead services the slugs and labels used in the navigation", () => {
    expect(leadServices.map((service) => ({ href: serviceHref(service), label: service.name }))).toEqual(serviceNav);
  });

  it("covers every quote service once across lead and secondary services", () => {
    const names = [...leadServices, ...secondaryServices].map((service) => service.name).sort();
    expect(names).toEqual(QUOTE_SERVICES.filter((service) => service !== "Other").sort());
    expect(secondaryServices.map((service) => service.name)).toEqual(["Kitchen fitting", "Carpentry & panelling", "Loft conversion"]);
  });

  it("gives each lead service a unique title and description", () => {
    const titles = leadServices.map((service) => service.title);
    const descriptions = leadServices.map((service) => service.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const service of leadServices) {
      expect(service.title.length, service.slug).toBeGreaterThan(10);
      expect(service.description.length, service.slug).toBeGreaterThan(50);
      expect(service.description.length, service.slug).toBeLessThanOrEqual(160);
      expect(service.intro.length, service.slug).toBeGreaterThan(0);
      expect(service.includes.length, service.slug).toBeGreaterThan(2);
    }
  });

  it("shows only photos of the service itself", () => {
    for (const service of [...leadServices, ...secondaryServices]) {
      expect(service.photo.service, service.name).toBe(service.name);
    }
    for (const service of leadServices) {
      expect(service.photos.length, service.slug).toBeGreaterThan(0);
      for (const project of service.photos) {
        expect(project.service, project.file).toBe(service.name);
      }
    }
  });

  it("makes no unverified claims", () => {
    for (const service of [...leadServices, ...secondaryServices]) {
      const copy = JSON.stringify({ ...service, photo: undefined, photos: undefined });
      expect(copy, service.name).not.toMatch(banned);
    }
  });
});

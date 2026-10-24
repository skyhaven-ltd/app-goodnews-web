import { describe, expect, it } from "vitest";
import { DEFAULT_AREAS, buildLocalBusiness, serializeJsonLd } from "./jsonld";

const site = "https://example.test";

describe("buildLocalBusiness", () => {
  it("describes the business with schema.org LocalBusiness fields", () => {
    const data = buildLocalBusiness({ site });
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://example.test/#business",
      name: "Good News Plastering",
      url: "https://example.test/",
      telephone: "+447456182265",
      founder: { "@type": "Person", name: "Darren Goodchild" },
      address: { "@type": "PostalAddress", addressCountry: "GB" },
    });
  });

  it("serves the default regions unless areas are given", () => {
    expect(buildLocalBusiness({ site }).areaServed).toEqual(DEFAULT_AREAS.map((name) => ({ "@type": "Place", name })));
    expect(buildLocalBusiness({ site, areas: ["Solihull"] }).areaServed).toEqual([{ "@type": "Place", name: "Solihull" }]);
    expect(DEFAULT_AREAS).toEqual(["Birmingham", "Worcestershire", "Evesham"]);
  });

  it("lists the trades offered without the catch-all option", () => {
    const { knowsAbout } = buildLocalBusiness({ site });
    expect(knowsAbout).toContain("Plastering");
    expect(knowsAbout).toContain("Painting & Decorating");
    expect(knowsAbout).toContain("Gardening & Landscaping");
    expect(knowsAbout).not.toContain("Other");
  });

  it("includes the page, image and description when given", () => {
    const data = buildLocalBusiness({
      site,
      page: "https://example.test/areas/solihull",
      image: "https://example.test/_astro/og.jpg",
      description: "Plastering in Solihull.",
    });
    expect(data.image).toBe("https://example.test/_astro/og.jpg");
    expect(data.description).toBe("Plastering in Solihull.");
    expect(data.mainEntityOfPage).toBe("https://example.test/areas/solihull");
  });

  it("leaves out unknown and placeholder values", () => {
    const data = buildLocalBusiness({ site });
    const json = JSON.stringify(data);
    expect(json).not.toContain("PLACEHOLDER");
    expect(data).not.toHaveProperty("email");
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");
    expect(data.address).not.toHaveProperty("streetAddress");
  });
});

describe("serializeJsonLd", () => {
  it("round-trips the data and cannot close the script element", () => {
    const data = { name: "</script><script>alert(1)</script>" };
    const text = serializeJsonLd(data);
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual(data);
  });
});

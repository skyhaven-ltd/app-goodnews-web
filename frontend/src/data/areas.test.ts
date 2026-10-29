import { describe, expect, it } from "vitest";
import { areaHref, areas } from "./areas";

const banned = /insured|accredit|guarantee|review|award|certified|approved|testimonial|best in|number one|no\.? ?1|free|started with|most of his work/i;
const pastWork =
  /\b(has|have|had)\s+(already\s+)?(worked|done|completed|finished|plastered|decorated|fitted|built)\b|\b(recent|previous|past|completed)\s+(jobs?|work|projects?)\b|\b(customers|clients|homeowners)\s+(in|across)\b[^.]*\b(say|chose|trust)\b|\d+\s*(jobs|customers|clients|homes)/i;

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function sentences(paragraphs: string[]): string[] {
  return paragraphs.flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/)).map((sentence) => sentence.trim().toLowerCase());
}

describe("areas", () => {
  it("lists the ten areas in scope with unique slugs", () => {
    expect(areas.map((area) => area.name)).toEqual([
      "Solihull",
      "Knowle & Dorridge",
      "Sutton Coldfield",
      "Edgbaston & Harborne",
      "Barnt Green & Bromsgrove",
      "Malvern",
      "Broadway",
      "Pershore",
      "Evesham",
      "Stratford-upon-Avon",
    ]);
    const slugs = areas.map((area) => area.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const area of areas) {
      expect(area.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(areaHref(area)).toBe(`/areas/${area.slug}`);
    }
  });

  it("gives each area at least 150 words of copy", () => {
    for (const area of areas) {
      expect(words(area.copy.join(" ")), area.name).toBeGreaterThanOrEqual(150);
    }
  });

  it("shares no sentence between areas or within one", () => {
    const seen = new Map<string, string>();
    for (const area of areas) {
      for (const sentence of sentences(area.copy)) {
        expect(seen.get(sentence), `${area.name}: ${sentence}`).toBeUndefined();
        seen.set(sentence, area.name);
      }
    }
  });

  it("names its own area in the copy", () => {
    for (const area of areas) {
      const copy = area.copy.join(" ");
      for (const part of area.name.split(" & ")) {
        expect(copy, area.name).toContain(part);
      }
    }
  });

  it("gives each area a unique title and description", () => {
    const titles = areas.map((area) => area.title);
    const descriptions = areas.map((area) => area.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const area of areas) {
      expect(area.title, area.name).toContain(area.name);
      expect(area.description, area.name).toContain(area.name);
      expect(area.description.length, area.name).toBeGreaterThan(50);
      expect(area.description.length, area.name).toBeLessThanOrEqual(160);
      expect(area.region.length, area.name).toBeGreaterThan(0);
    }
  });

  it("makes no unverified claims and claims no past jobs in an area", () => {
    for (const area of areas) {
      const copy = JSON.stringify(area);
      expect(copy, area.name).not.toMatch(banned);
      expect(copy, area.name).not.toMatch(pastWork);
    }
  });

  it("speaks as we, without naming Darren or using he, him or his", () => {
    for (const area of areas) {
      expect(JSON.stringify(area), area.name).not.toMatch(/Darren|\b(he|him|his)\b|—/i);
    }
  });
});

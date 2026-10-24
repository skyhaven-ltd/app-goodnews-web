import { describe, expect, it } from "vitest";
import config from "../../scripts/images.config.json";
import { QUOTE_SERVICES } from "../lib/quote";
import { beforeAfterPairs, projectByFile, projects } from "./projects";

const outputs = Object.keys(import.meta.glob("../assets/projects/*")).map((path) => path.split("/").pop()).sort();
const originals = Object.keys(import.meta.glob("../../photos/*")).map((path) => path.split("/").pop()).sort();

describe("projects", () => {
  it("has one project per processed photo", () => {
    const processed = config.photos.map((photo) => photo.output).sort();
    expect(projects.map((project) => project.file).sort()).toEqual(processed);
    expect(outputs).toEqual(processed);
  });

  it("lists every original photo as processed or excluded", () => {
    const listed = [...config.photos, ...config.excluded].map((photo) => photo.source).sort();
    expect(originals).toEqual(listed);
  });

  it("gives every project unique alt text and a known service", () => {
    const alts = projects.map((project) => project.alt);
    expect(new Set(alts).size).toBe(alts.length);
    for (const project of projects) {
      expect(project.alt.length, project.file).toBeGreaterThan(20);
      expect(project.image, project.file).toBeTruthy();
      expect(QUOTE_SERVICES).toContain(project.service);
    }
  });

  it("finds projects by file and rejects unknown files", () => {
    expect(projectByFile("finished-landing.jpg").service).toBe("Painting & Decorating");
    expect(() => projectByFile("missing.jpg")).toThrow("Unknown project missing.jpg");
  });

  it("pairs before and after photos only as two different shots of a named room", () => {
    for (const pair of beforeAfterPairs) {
      expect(pair.room.length, pair.before.file).toBeGreaterThan(3);
      expect(pair.before.file).not.toBe(pair.after.file);
    }
  });
});

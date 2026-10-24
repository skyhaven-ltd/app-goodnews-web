import { describe, expect, it } from "vitest";
import { testimonials, testimonialsEnabled } from "./testimonials";

describe("testimonials", () => {
  it("are switched off and empty until real ones are supplied", () => {
    expect(testimonialsEnabled).toBe(false);
    expect(testimonials).toEqual([]);
  });
});

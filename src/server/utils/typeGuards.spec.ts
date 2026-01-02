import { describe, expect, it } from "vitest";
import { hasValue } from "./typeGuards";

describe("hasValue Type Guard", () => {
  it("should return true for non-null and non-undefined values", () => {
    expect(hasValue(5)).toBe(true);
    expect(hasValue("test")).toBe(true);
    expect(hasValue({})).toBe(true);
    expect(hasValue([])).toBe(true);
  });

  it("should return false for null and undefined values", () => {
    expect(hasValue(null)).toBe(false);
    expect(hasValue(undefined)).toBe(false);
  });
});

describe("hasNoValue Type Guard", () => {
  it("should return true for null and undefined values", () => {
    expect(hasValue(null)).toBe(false);
    expect(hasValue(undefined)).toBe(false);
  });

  it("should return false for non-null and non-undefined values", () => {
    expect(hasValue(5)).toBe(true);
    expect(hasValue("test")).toBe(true);
    expect(hasValue({})).toBe(true);
    expect(hasValue([])).toBe(true);
  });
});

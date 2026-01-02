import { describe, expect, it } from "vitest";
import { isEmpty } from "./funcs";

describe("isEmpty Funnction", () => {
  it("should return true for empty arrays", () => {
    expect(isEmpty([])).toBe(true);
  });

  it("should return false for non-empty arrays", () => {
    expect(isEmpty([1, 2, 3])).toBe(false);
  });
});

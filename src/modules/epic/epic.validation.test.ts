import { describe, it, expect } from "vitest";
import {
  buildValidEpicCreateInput,
  validateEpicCreateInput,
  validateEpicFormInput,
  validateEpicUpdateInput,
} from "./epic.validation";

describe("validateEpicCreateInput", () => {
  const valid = buildValidEpicCreateInput("owner-123");

  it("accepts a fully populated payload", () => {
    expect(validateEpicCreateInput(valid)).toEqual(valid);
  });

  it("rejects whitespace-only name", () => {
    expect(() => validateEpicCreateInput({ ...valid, name: "   " })).toThrow(
      /name is required and cannot be empty or whitespace/
    );
  });

  it("rejects whitespace-only description", () => {
    expect(() => validateEpicCreateInput({ ...valid, description: "  " })).toThrow(
      /description is required and cannot be empty or whitespace/
    );
  });

  it("requires an owner", () => {
    expect(() => validateEpicCreateInput({ ...valid, ownerId: "" })).toThrow(/owner is required/);
  });

  it("requires color and icon", () => {
    expect(() => validateEpicCreateInput({ ...valid, color: "" })).toThrow(/color is required/);
    expect(() => validateEpicCreateInput({ ...valid, icon: null })).toThrow(/icon is required/);
  });

  it("requires at least one non-empty label", () => {
    expect(() => validateEpicCreateInput({ ...valid, labels: ["  ", ""] })).toThrow(
      /at least one label is required/
    );
  });

  it("rejects due date before start date", () => {
    expect(() =>
      validateEpicCreateInput({ ...valid, startDate: "2026-06-01", dueDate: "2026-01-01" })
    ).toThrow(/due date cannot be before start date/);
  });
});

describe("validateEpicUpdateInput", () => {
  it("rejects empty name when provided", () => {
    expect(() => validateEpicUpdateInput({ name: "   " })).toThrow(
      /name is required and cannot be empty or whitespace/
    );
  });

  it("rejects due date before start date when both are provided", () => {
    expect(() =>
      validateEpicUpdateInput({ startDate: "2026-12-01", dueDate: "2026-01-01" })
    ).toThrow(/due date cannot be before start date/);
  });
});

describe("validateEpicFormInput", () => {
  it("returns a friendly error instead of throwing", () => {
    const result = validateEpicFormInput({ name: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/name is required/);
    }
  });
});

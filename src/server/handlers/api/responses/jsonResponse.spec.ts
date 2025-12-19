import { describe, expect, expectTypeOf, it } from "vitest";
import z from "zod";
import {
  isJsonResponse,
  isJsonResponseSchema,
  JsonResponseSchema,
  JsonResponseSchemaToResponseType,
} from "./jsonResponse";

describe("empty response", () => {
  it("can correctly infer the response type from schema", () => {
    type Schema = {
      dataType: "application/json";
      dataSchema: z.ZodString;
    };

    type Inferred = JsonResponseSchemaToResponseType<200, Schema>;

    type Expected = {
      code: 200;
      dataType: "application/json";
      json: string;
    };

    expectTypeOf<Inferred>().toEqualTypeOf<Expected>();
  });

  it("can correctly identify a literal with the type", () => {
    type Schema = {
      dataType: "application/json";
      dataSchema: z.ZodString;
    };

    type Expected = JsonResponseSchema<z.ZodString>;

    expectTypeOf<Schema>().toEqualTypeOf<Expected>();
  });

  it("can correctly validate if a response is of type", () => {
    const res = {
      dataType: "application/json",
      json: "string",
    };

    expect(isJsonResponse(res)).toBe(true);
  });

  it("can correctly validate if a response is not of type", () => {
    const res = {
      dataType: "application/data", //<=== Wrong
      json: "string",
    };

    expect(isJsonResponse(res)).toBe(false);
  });

  it("can correctly validate if a response schema is of type", () => {
    const res = {
      dataType: "application/json",
      dataSchema: z.string(),
    };

    expect(isJsonResponseSchema(res)).toBe(true);
  });

  it("can correctly validate if a response schema is not of type", () => {
    const res = {
      dataType: "application/data", // <=== Wrong
      dataSchema: z.string(),
    };

    expect(isJsonResponseSchema(res)).toBe(false);
  });
});

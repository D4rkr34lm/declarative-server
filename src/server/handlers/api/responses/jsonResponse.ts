import z from "zod";
import { AbstractResponseSchema } from "./index.js";

export interface JsonResponseSchema<
  DataSchema extends z.ZodType = z.ZodType,
  Headers extends string[] | undefined = string[] | undefined,
> extends AbstractResponseSchema<Headers> {
  type: "json";
  schema: DataSchema;
}

export function isJsonResponseSchema(
  value: AbstractResponseSchema,
): value is JsonResponseSchema {
  return value.type === "json";
}

import z from "zod";
import { HttpStatusCode } from "../../../constants/HttpStatusCodes";
import { JsonResponseSchema } from "./jsonResponse";

export type AbstractResponseSchema<
  Headers extends string[] | undefined = string[] | undefined,
> = {
  type: string;
  headers?: Headers;
};

export type HandlerResponse<Code extends HttpStatusCode, Data> = {
  code: Code;
  data: Data;
};

export type GenericResponseSchema = JsonResponseSchema;

export type GenericResponseSchemaMap = {
  [key in HttpStatusCode]?: GenericResponseSchema;
};

export type InferHeadersFromSchema<Schema extends AbstractResponseSchema> =
  Schema extends { headers: infer Headers }
    ? Headers extends string[]
      ? { headers: { [K in Headers[number]]: string } }
      : {}
    : {};

export type InferResponseFromSchema<
  Code extends HttpStatusCode,
  Schema extends GenericResponseSchema,
> =
  Schema extends JsonResponseSchema<infer DataSchema>
    ? HandlerResponse<Code, z.infer<DataSchema>> &
        InferHeadersFromSchema<Schema>
    : never;

import { Request } from "express";
import z from "zod";
import { HttpMethod } from "../constants/HttpMethods";
import { MaybeValue } from "../utils/types";

type ExtractPathParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

type HandlerFromDefinition<
  Definition extends ApiEndpointDefinition<
    string,
    HttpMethod,
    MaybeValue<"requestBody", z.ZodType>
  >,
> = (
  request: Request<
    ExtractPathParams<Definition["path"]>,
    unknown,
    Definition extends MaybeValue<"requestBody", infer BodyType>
      ? z.infer<BodyType>
      : never,
    Definition extends MaybeValue<"query", infer QueryType>
      ? z.infer<QueryType>
      : never
  >,
) => void;

export type ApiEndpointDefinition<
  Path extends string,
  Method extends HttpMethod,
  RequestBody = MaybeValue<"requestBody", z.ZodType>,
  Query = MaybeValue<"query", z.ZodType>,
> = {
  path: Path;
  method: Method;
} & RequestBody &
  Query;

export function createApiEndpointHandler<
  EndpointDefinition extends ApiEndpointDefinition<
    string,
    HttpMethod,
    MaybeValue<"requestBody", z.ZodType>,
    MaybeValue<"query", z.ZodType>
  >,
>(
  options: EndpointDefinition,
  handler: HandlerFromDefinition<EndpointDefinition>,
) {
  return {
    ...options,
    handler,
  };
}

export type ApiEndpointHandler = ReturnType<typeof createApiEndpointHandler>;

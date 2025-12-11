import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { HttpMethod } from "../constants/HttpMethods";
import {
  ClientErrorStatusCode,
  SuccessStatusCode,
} from "../constants/HttpStatusCodes";
import { MaybeValue } from "../utils/types";

type ExtractPathParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

type ResponseSuccessDefinition<
  Code extends SuccessStatusCode,
  Data extends MaybeValue<"data", z.ZodType>,
> = {
  code: Code;
} & Data;

type ResponseErrorDefinition<
  Msg extends string,
  Code extends ClientErrorStatusCode,
  Data extends MaybeValue<"data", z.ZodType>,
> = {
  code: Code;
  message: Msg;
} & Data;

export type ApiEndpointDefinition<
  Path extends string,
  Method extends HttpMethod,
  RequestBodySchema extends MaybeValue<"requestBodySchema", z.ZodType>,
  QuerySchema extends MaybeValue<"querySchema", z.ZodType>,
  ResponseBodySchema extends MaybeValue<
    "successResponseSchema",
    ResponseSuccessDefinition<SuccessStatusCode, MaybeValue<"data", z.ZodType>>
  >,
  PossibleResponseErrors extends Array<
    ResponseErrorDefinition<
      string,
      ClientErrorStatusCode,
      MaybeValue<"data", z.ZodType>
    >
  >,
> = {
  path: Path;
  method: Method;
  possibleResponseErrorSchemas: PossibleResponseErrors;
} & RequestBodySchema &
  QuerySchema &
  ResponseBodySchema;

type HandlerFromDefinition<
  Definition extends ApiEndpointDefinition<
    string,
    HttpMethod,
    MaybeValue<"requestBodySchema", z.ZodType>,
    MaybeValue<"querySchema", z.ZodType>,
    ResponseSuccessDefinition<SuccessStatusCode, MaybeValue<"data", z.ZodType>>,
    Array<
      ResponseErrorDefinition<
        string,
        ClientErrorStatusCode,
        MaybeValue<"data", z.ZodType>
      >
    >
  >,
  RequestBody = Definition extends MaybeValue<
    "requestBodySchema",
    infer BodyType
  >
    ? z.infer<BodyType>
    : never,
  QuerySchema = Definition extends MaybeValue<"querySchema", infer QueryType>
    ? z.infer<QueryType>
    : never,
  SuccessResponse = Definition extends MaybeValue<
    "successResponseSchema",
    infer ResponseType
  >
    ? {
        code: ResponseType extends ResponseSuccessDefinition<
          infer Code,
          z.ZodType
        >
          ? Code
          : never;
        data: ResponseType extends ResponseSuccessDefinition<
          SuccessStatusCode,
          infer Data
        >
          ? Data extends MaybeValue<"data", z.ZodType>
            ? z.infer<Data>
            : never
          : never;
      }
    : unknown,
  ErrorResponse =
    Definition["possibleResponseErrorSchemas"][number] extends ResponseErrorDefinition<
      infer Msg,
      infer Code,
      infer Data
    >
      ? {
          code: Code;
          message: Msg;
          data: Data extends MaybeValue<"data", z.ZodType>
            ? z.infer<Data>
            : never;
        }
      : never,
> = (
  request: Request<
    ExtractPathParams<Definition["path"]>,
    unknown,
    RequestBody,
    QuerySchema
  >,
) => Promise<
  | SuccessResponse
  | ErrorResponse
  | {
      code: 500;
      message: "Internal Server Error";
    }
>;

export function createApiEndpointHandler<
  const EndpointDefinition extends ApiEndpointDefinition<
    string,
    HttpMethod,
    MaybeValue<"requestBodySchema", z.ZodType>,
    MaybeValue<"querySchema", z.ZodType>,
    ResponseSuccessDefinition<SuccessStatusCode, MaybeValue<"data", z.ZodType>>,
    Array<
      ResponseErrorDefinition<
        string,
        ClientErrorStatusCode,
        MaybeValue<"data", z.ZodType>
      >
    >
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

export function buildApiEndpointHandler(handler: ApiEndpointHandler) {
  return expressAsyncHandler(
    async (
      request: Request<
        never,
        unknown,
        unknown,
        unknown,
        Record<string, unknown>
      >,
      response: Response,
    ) => {
      const result = await handler.handler(request);

      response.status(result.code).json(result);
    },
  );
}

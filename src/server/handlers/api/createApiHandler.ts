import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods";
import { HttpStatusCode } from "../../constants/HttpStatusCodes";
import { SecurityScheme } from "../../security/SecuritySchema";
import { Prettify } from "../../utils/types";
import { ApiEndpointDefinition } from "./EndpointDefinition";
import { ApiEndpointHandler } from "./EndpointHandler";
import { HandlerForDefinition } from "./HandlerFromDefinition";
import { GenericResponseSchemaMap, HandlerResponse } from "./responses";

export function createApiEndpointHandler<
  const ResponsesMap extends GenericResponseSchemaMap,
  const Path extends string,
  const Method extends HttpMethod,
  const RequestBody extends z.ZodType | undefined = undefined,
  const Query extends z.ZodType | undefined = undefined,
  const SecuritySchemas extends SecurityScheme<unknown>[] = [],
>(
  definition: Prettify<
    ApiEndpointDefinition<
      Path,
      Method,
      RequestBody,
      Query,
      ResponsesMap,
      SecuritySchemas
    >
  >,
  handler: HandlerForDefinition<
    Path,
    RequestBody,
    Query,
    ResponsesMap,
    SecuritySchemas
  >,
) {
  return {
    definition,
    handler,
  };
}

export function buildApiEndpointHandler<
  Handler extends ApiEndpointHandler<
    HandlerResponse<HttpStatusCode, unknown>,
    Record<string, string>,
    unknown,
    unknown,
    unknown
  >,
>(handler: Handler) {
  return expressAsyncHandler(async (request: Request, response: Response) => {
    const result = await handler({
      request,
      response,
      parameters: request.params,
      query: request.query,
      body: request.body,
      caller: response.locals.caller,
    });

    response.status(result.code).send(result.data);
  });
}

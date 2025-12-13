import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods";
import { ApiEndpointDefinition } from "./EndpointDefinition";
import { ApiEndpointHandler } from "./EndpointHandler";
import { HandlerForDefinition } from "./HandlerFromDefinition";
import { GenericResponseSchemaMap } from "./responses";
import { isJsonResponse } from "./responses/jsonResponse";

export function createApiEndpointHandler<
  const ResponsesMap extends GenericResponseSchemaMap,
  const Path extends string,
  const Method extends HttpMethod,
  const RequestBody extends z.ZodType | undefined = undefined,
  const Query extends z.ZodType | undefined = undefined,
>(
  definition: ApiEndpointDefinition<
    Path,
    Method,
    RequestBody,
    Query,
    ResponsesMap
  >,
  handler: HandlerForDefinition<Path, RequestBody, Query, ResponsesMap>,
) {
  return {
    type: "__API_ENDPOINT_DEFINITION__",
    definition,
    handler,
  };
}

export function buildApiEndpointHandler(handler: ApiEndpointHandler) {
  return expressAsyncHandler(async (request: Request, response: Response) => {
    const result = await handler(request);

    if (isJsonResponse(result)) {
      response.status(result.code).json(result.json);
    } else {
      response.status(result.code).send();
    }
  });
}

import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods";
import { ApiEndpointDefinition } from "./EndpointDefinition";
import { ApiEndpointHandler } from "./EndpointHandler";
import { HandlerForDefinition } from "./HandlerFromDefinition";
import { GenericResponse, GenericResponseSchemaMap } from "./responses";
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
    definition,
    handler,
  };
}

export function buildApiEndpointHandler(
  handler: ApiEndpointHandler<
    Record<string, string>,
    unknown,
    unknown,
    GenericResponse
  >,
) {
  return expressAsyncHandler(async (request: Request, response: Response) => {
    const result = await handler(request);

    if (isJsonResponse(result)) {
      response.status(result.code).json(result.json);
    } else {
      response.status(result.code).send();
    }
  });
}

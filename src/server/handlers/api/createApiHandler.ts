import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods";
import { SecurityScheme } from "../../security/SecuritySchema";
import { Prettify } from "../../utils/types";
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
    Record<string, string>,
    unknown,
    unknown,
    GenericResponse,
    unknown
  >,
>(handler: Handler) {
  return expressAsyncHandler(async (request: Request, response: Response) => {
    const caller = response.locals.caller;

    const extractedRequestData = {
      parameters: request.params,
      query: request.query,
      body: request.body,
      caller,
    };

    const result = await handler(request, extractedRequestData);

    if (isJsonResponse(result)) {
      response.status(result.code).json(result.json);
    } else {
      response.status(result.code).send();
    }
  });
}

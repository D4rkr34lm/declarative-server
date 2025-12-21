import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods.js";
import { HttpStatusCode } from "../../constants/HttpStatusCodes.js";
import { SecurityScheme } from "../../security/SecuritySchema.js";
import { Prettify } from "../../utils/types.js";
import { ApiEndpointDefinition } from "./EndpointDefinition.js";
import { ApiEndpointHandler } from "./EndpointHandler.js";
import { HandlerForDefinition } from "./HandlerFromDefinition.js";
import {
  GenericResponseSchemaMap,
  HandlerResponse,
} from "./responses/index.js";

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
    HandlerResponse<HttpStatusCode, unknown> & {
      headers?: { [key: string]: string };
    },
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

    response
      .status(result.code)
      .set(result.headers ?? {})
      .send(result.data);
  });
}

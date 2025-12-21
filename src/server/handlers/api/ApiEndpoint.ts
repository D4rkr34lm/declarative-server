import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods.js";
import { ApiEndpointDefinition } from "./EndpointDefinition.js";
import { HandlerForDefinition } from "./HandlerFromDefinition.js";
import { GenericResponseSchemaMap } from "./responses/index.js";

export interface ApiEndpoint<
  Path extends string = string,
  Method extends HttpMethod = HttpMethod,
  RequestBody extends z.ZodType | undefined = undefined | z.ZodType,
  Query extends z.ZodType | undefined = undefined | z.ZodType,
  ResponseMap extends GenericResponseSchemaMap = GenericResponseSchemaMap,
  Handler extends HandlerForDefinition<Path, RequestBody, Query, ResponseMap> =
    HandlerForDefinition<Path, RequestBody, Query, ResponseMap>,
> {
  definition: ApiEndpointDefinition<
    Path,
    Method,
    RequestBody,
    Query,
    ResponseMap
  >;
  handler: Handler;
}

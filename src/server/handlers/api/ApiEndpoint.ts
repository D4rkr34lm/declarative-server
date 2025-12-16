import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods";
import { ApiEndpointDefinition } from "./EndpointDefinition";
import { HandlerForDefinition } from "./HandlerFromDefinition";
import { GenericResponseSchemaMap } from "./responses";

export interface ApiEndpoint<
  Path extends string = string,
  Method extends HttpMethod = HttpMethod,
  RequestBody extends z.ZodType | undefined = z.ZodType | undefined,
  Query extends z.ZodType | undefined = z.ZodType | undefined,
  ResponseMap extends GenericResponseSchemaMap = GenericResponseSchemaMap,
> {
  definition: ApiEndpointDefinition<
    Path,
    Method,
    RequestBody,
    Query,
    ResponseMap
  >;
  handler: HandlerForDefinition<Path, RequestBody, Query, ResponseMap>;
}

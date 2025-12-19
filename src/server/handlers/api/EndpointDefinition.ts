import z from "zod";
import { HttpMethod } from "../../constants/HttpMethods";
import { SecurityScheme } from "../../security/SecuritySchema";
import { GenericResponseSchemaMap } from "./responses/index";

export interface ApiEndpointMeta {
  name: string;
  group: string;
  description: string;
}

export type ApiEndpointDefinition<
  Path extends string = string,
  Method extends HttpMethod = HttpMethod,
  RequestBody extends z.ZodType | undefined = z.ZodType | undefined,
  Query extends z.ZodType | undefined = z.ZodType | undefined,
  ResponseMap extends GenericResponseSchemaMap = GenericResponseSchemaMap,
  SecuritySchemes extends SecurityScheme<unknown>[] = SecurityScheme<unknown>[],
> = {
  meta: ApiEndpointMeta;
  path: Path;
  method: Method;
  requestBodySchema?: RequestBody;
  querySchema?: Query;
  responseSchemas: ResponseMap;
  securitySchemes?: SecuritySchemes;
};

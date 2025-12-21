import z from "zod";
import { HttpStatusCode } from "../../constants/HttpStatusCodes";
import { SecurityScheme } from "../../security/SecuritySchema";
import { Prettify } from "../../utils/types";
import { ApiEndpointHandler } from "./EndpointHandler";
import { ExtractPathParams } from "./PathParameters";
import {
  GenericResponseSchema,
  GenericResponseSchemaMap,
  InferResponseFromSchema,
} from "./responses/index";

export type HandlerForDefinition<
  Path extends string,
  RequestBody extends z.ZodType | undefined,
  Query extends z.ZodType | undefined,
  ResponsesMap extends GenericResponseSchemaMap,
  SecuritySchemas extends SecurityScheme<unknown>[] = [],
> = ApiEndpointHandler<
  Exclude<
    Prettify<
      {
        [K in keyof ResponsesMap]: K extends HttpStatusCode
          ? InferResponseFromSchema<
              K,
              ResponsesMap[K] extends GenericResponseSchema
                ? ResponsesMap[K]
                : never
            >
          : never;
      }[keyof ResponsesMap]
    >,
    undefined
  >,
  ExtractPathParams<Path>,
  RequestBody extends undefined ? undefined : z.infer<RequestBody>,
  Query extends undefined ? undefined : z.infer<Query>,
  SecuritySchemas extends SecurityScheme<infer Caller>[] ? Caller : unknown
>;

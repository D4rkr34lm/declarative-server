import z from "zod";
import { HttpStatusCode } from "../../constants/HttpStatusCodes.js";
import { SecurityScheme } from "../../security/SecuritySchema.js";
import { Prettify } from "../../utils/types.js";
import { ApiEndpointHandler } from "./EndpointHandler.js";
import { ExtractPathParams } from "./PathParameters.js";
import {
  GenericResponseSchema,
  GenericResponseSchemaMap,
  InferResponseFromSchema,
} from "./responses/index.js";

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

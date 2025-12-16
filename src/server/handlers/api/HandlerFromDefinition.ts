import z from "zod";
import { HttpStatusCode } from "../../constants/HttpStatusCodes";
import { Prettify } from "../../utils/types";
import { ApiEndpointHandler } from "./EndpointHandler";
import { ExtractPathParams } from "./PathParameters";
import { EmptyResponse, EmptyResponseSchema } from "./responses/emptyResponse";
import { GenericResponseSchemaMap } from "./responses/index";
import {
  JsonResponseSchema,
  JsonResponseSchemaToResponseType,
} from "./responses/jsonResponse";

export type HandlerForDefinition<
  Path extends string,
  RequestBody extends z.ZodType | undefined,
  Query extends z.ZodType | undefined,
  ResponsesMap extends GenericResponseSchemaMap,
> = ApiEndpointHandler<
  ExtractPathParams<Path>,
  RequestBody extends undefined ? undefined : z.infer<RequestBody>,
  Query extends undefined ? undefined : z.infer<Query>,
  Prettify<
    Exclude<
      {
        [K in keyof ResponsesMap]: K extends HttpStatusCode
          ? ResponsesMap[K] extends JsonResponseSchema
            ? JsonResponseSchemaToResponseType<K, ResponsesMap[K]>
            : ResponsesMap[K] extends EmptyResponseSchema
              ? EmptyResponse<K>
              : never
          : never;
      }[keyof ResponsesMap],
      undefined
    >
  >
>;

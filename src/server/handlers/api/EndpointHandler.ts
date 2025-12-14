import { Request } from "express";

import { HttpStatusCodes } from "../../constants/HttpStatusCodes";
import { GenericResponse } from "./responses";

export type ApiEndpointHandler<
  PathParams extends Record<string, string> = {},
  RequestBody = unknown,
  Query = unknown,
  Responses extends GenericResponse = never,
> = (
  request: Request<
    PathParams,
    unknown,
    RequestBody,
    Query,
    Record<string, unknown>
  >,
) => Promise<
  | Responses
  | {
      code: (typeof HttpStatusCodes)["InternalServerError_500"];
    }
>;

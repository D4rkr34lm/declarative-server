import { Request, Response } from "express";
import { HttpStatusCode } from "../../constants/HttpStatusCodes";
import { HandlerResponse } from "./responses";

export type ApiEndpointHandler<
  Responses extends HandlerResponse<HttpStatusCode, unknown>,
  PathParams extends Record<string, string> = {},
  RequestBody = unknown,
  Query = unknown,
  Caller = unknown,
> = (typedRequestData: {
  request: Request<
    PathParams,
    unknown,
    RequestBody,
    Query,
    Record<string, unknown>
  >;
  response: Response<unknown>;
  parameters: PathParams;
  query: Query;
  body: RequestBody;
  caller: Caller;
}) => Promise<Responses>;

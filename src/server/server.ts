import cookieParser from "cookie-parser";
import express, { Application } from "express";
import z from "zod";
import { HttpMethod } from "./constants/HttpMethods";
import { ApiEndpoint } from "./handlers/api/ApiEndpoint";
import { buildApiEndpointHandler } from "./handlers/api/createApiHandler";
import { ApiEndpointDefinition } from "./handlers/api/EndpointDefinition";
import { GenericResponseSchemaMap } from "./handlers/api/responses";
import { buildRequestLogger, buildResponseLogger } from "./middleware/logging";
import {
  buildBodyValidatorMiddleware,
  buildQueryValidatorMiddleware,
} from "./middleware/validation";
import { Logger, NoOpLogger } from "./utils/logging";
import { hasNoValue, hasValue } from "./utils/typeGuards";

export interface ServerConfig<ApiEndpoints extends ApiEndpoint[]> {
  inDevMode: boolean;
  port: number;
  logger: Logger | boolean;
  endpoints: ApiEndpoints;
}
export interface Server {
  expressApp: Application;
  logger: Logger | boolean;
  endpointDefinitions: ApiEndpointDefinition<
    string,
    HttpMethod,
    z.ZodType | undefined,
    z.ZodType | undefined,
    GenericResponseSchemaMap
  >[];
  start: () => void;
}

function registerApiEndpoint<Endpoint extends ApiEndpoint>(
  expressApp: Application,
  endpoint: Endpoint,
) {
  const { definition, handler } = endpoint;

  const handlerStack = [
    hasValue(definition.querySchema)
      ? buildQueryValidatorMiddleware(definition.querySchema)
      : null,
    hasValue(definition.requestBodySchema)
      ? buildBodyValidatorMiddleware(definition.requestBodySchema)
      : null,
    buildApiEndpointHandler(handler),
  ].filter(hasValue);

  expressApp[definition.method](definition.path, handlerStack);
}

export function createServer<ApiEndpoints extends ApiEndpoint[]>(
  config: ServerConfig<ApiEndpoints>,
): Server {
  const { port, inDevMode, endpoints } = config;

  const logger: Logger =
    config.logger === true
      ? console
      : config.logger === false || hasNoValue(config.logger)
        ? NoOpLogger
        : config.logger;

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(buildRequestLogger(logger, inDevMode));
  app.use(buildResponseLogger(logger, inDevMode));

  endpoints.forEach((endpoint) => {
    registerApiEndpoint(app, endpoint);
  });

  return {
    expressApp: app,
    logger: logger,
    endpointDefinitions: endpoints.map((e) => e.definition),
    start: () => {
      app.listen(port);
    },
  };
}

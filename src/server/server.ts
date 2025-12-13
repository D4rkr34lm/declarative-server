import cookieParser from "cookie-parser";
import express, { Application } from "express";
import z from "zod";
import { HttpMethod } from "./constants/HttpMethods";
import { buildApiEndpointHandler } from "./handlers/api/createApiHandler";
import { ApiEndpointDefinition } from "./handlers/api/EndpointDefinition";
import { ApiEndpointHandler } from "./handlers/api/EndpointHandler";
import { buildRequestLogger, buildResponseLogger } from "./middleware/logging";
import {
  buildBodyValidatorMiddleware,
  buildQueryValidatorMiddleware,
} from "./middleware/validation";
import { Logger, NoOpLogger } from "./utils/logging";
import { hasNoValue, hasValue } from "./utils/typeGuards";

export interface ServerConfig {
  inDevMode: boolean;
  port: number;
  logger: Logger | boolean;
  endpoints: Array<{
    endpointHandler: ApiEndpointHandler;
    endpointDefinition: ApiEndpointDefinition<
      string,
      HttpMethod,
      z.ZodType,
      z.ZodType,
      {}
    >;
  }>;
}
export interface Server {
  expressApp: Application;
  logger: Logger | boolean;
  endpointDefinitions: ApiEndpointDefinition<
    string,
    HttpMethod,
    z.ZodType,
    z.ZodType,
    {}
  >[];
  start: () => void;
}

function registerApiEndpoint(
  expressApp: Application,
  endpointDefinition: ApiEndpointDefinition<
    string,
    HttpMethod,
    z.ZodType,
    z.ZodType,
    {}
  >,
  endpointHandler: ApiEndpointHandler,
) {
  const handlerStack = [
    hasValue(endpointDefinition.querySchema)
      ? buildQueryValidatorMiddleware(endpointDefinition.querySchema)
      : null,
    hasValue(endpointDefinition.requestBodySchema)
      ? buildBodyValidatorMiddleware(endpointDefinition.requestBodySchema)
      : null,
    buildApiEndpointHandler(endpointHandler),
  ].filter(hasValue);

  expressApp[endpointDefinition.method](endpointDefinition.path, handlerStack);
}

export function createServer(config: ServerConfig): Server {
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

  endpoints.forEach(({ endpointDefinition, endpointHandler }) => {
    registerApiEndpoint(app, endpointDefinition, endpointHandler);
  });

  return {
    expressApp: app,
    logger: logger,
    endpointDefinitions: endpoints.map((e) => e.endpointDefinition),
    start: () => {
      app.listen(port);
    },
  };
}

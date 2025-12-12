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

export interface ServerOptions {
  inDevMode?: boolean;
  port?: number;
  logger?: Logger | boolean;
}
export interface Server {
  _expressApp: Application;
  _logger: Logger | boolean;
  start: () => void;
  registerApiEndpoint: (endpoint: {
    endpointHandler: ApiEndpointHandler;
    endpointDefinition: ApiEndpointDefinition<
      string,
      HttpMethod,
      z.ZodType,
      z.ZodType,
      {}
    >;
  }) => void;
}

export function createServer(options: ServerOptions): Server {
  const { port = 3000, inDevMode = false } = options;

  const logger: Logger =
    options.logger === true
      ? console
      : options.logger === false || hasNoValue(options.logger)
        ? NoOpLogger
        : options.logger;

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(buildRequestLogger(logger, inDevMode));
  app.use(buildResponseLogger(logger, inDevMode));

  return {
    _expressApp: app,
    _logger: logger,
    start: () => {
      app.listen(port);
    },
    registerApiEndpoint: ({ endpointDefinition, endpointHandler }) => {
      registerApiEndpoint(app, endpointDefinition, endpointHandler);
    },
  };
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

import cookieParser from "cookie-parser";
import express, { Application } from "express";
import { ApiEndpoint } from "./handlers/api/ApiEndpoint.js";
import { buildApiEndpointHandler } from "./handlers/api/createApiHandler.js";
import { ApiEndpointDefinition } from "./handlers/api/EndpointDefinition.js";
import { HandlerForDefinition } from "./handlers/api/HandlerFromDefinition.js";
import { buildAuthenticationMiddleware } from "./middleware/auth.js";
import {
  buildRequestLogger,
  buildResponseLogger,
} from "./middleware/logging.js";
import {
  buildBodyValidatorMiddleware,
  buildQueryValidatorMiddleware,
} from "./middleware/validation.js";
import { isEmpty } from "./utils/funcs.js";
import { Logger, NoOpLogger } from "./utils/logging.js";
import { hasNoValue, hasValue } from "./utils/typeGuards.js";

export interface ServerConfig {
  inDevMode: boolean;
  port: number;
  logger: Logger | boolean;
}
export interface Server {
  expressApp: Application;
  logger: Logger | boolean;
  endpointDefinitions: ApiEndpointDefinition[];
  registerApiEndpoint<Definition extends ApiEndpointDefinition>({
    definition,
    handler,
  }: {
    definition: Definition;
    handler: HandlerForDefinition<
      Definition["path"],
      Definition["requestBodySchema"],
      Definition["querySchema"],
      Definition["responseSchemas"],
      Definition["securitySchemes"]
    >;
  }): void;
  start: () => void;
}

function registerApiEndpoint<Endpoint extends ApiEndpoint>(
  expressApp: Application,
  endpoint: Endpoint,
) {
  const { definition, handler } = endpoint;

  const handlerStack = [
    hasValue(definition.securitySchemes) && !isEmpty(definition.securitySchemes)
      ? buildAuthenticationMiddleware(definition.securitySchemes)
      : null,
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

export function createServer(config: ServerConfig): Server {
  const { port, inDevMode } = config;

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

  return {
    expressApp: app,
    logger: logger,
    endpointDefinitions: [],
    registerApiEndpoint(endpoint) {
      registerApiEndpoint(app, endpoint);
      this.endpointDefinitions.push(endpoint.definition);
    },
    start() {
      app.listen(port);
    },
  };
}

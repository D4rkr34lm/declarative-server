import cookieParser from "cookie-parser";
import express, { Application } from "express";
import { ZodType } from "zod";
import {
  ApiEndpointHandler,
  buildApiEndpointHandler,
} from "./handlers/apiHandler";
import { buildRequestLogger, buildResponseLogger } from "./middleware/logging";
import {
  buildBodyValidatorMiddleware,
  buildQueryValidatorMiddleware,
} from "./middleware/validation";
import { Logger, NoOpLogger } from "./utils/logging";
import { hasNoValue } from "./utils/typeGuards";
import { isWithValue } from "./utils/types";

export interface ServerOptions {
  inDevMode?: boolean;
  port?: number;
  logger?: Logger | boolean;
}
export interface Server {
  _expressApp: Application;
  _logger: Logger | boolean;
  start: () => void;
  registerApiEndpoint: (endpointHandler: ApiEndpointHandler) => void;
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
    registerApiEndpoint: (endpointHandler) => {
      registerApiEndpoint(app, endpointHandler);
    },
  };
}

function registerApiEndpoint(
  expressApp: Application,
  endpointHandler: ApiEndpointHandler,
) {
  if (isWithValue<"querySchema", ZodType>("querySchema", endpointHandler)) {
    expressApp[endpointHandler.method](
      endpointHandler.path,
      buildQueryValidatorMiddleware(endpointHandler.querySchema),
    );
  }

  if (
    isWithValue<"requestBodySchema", ZodType>(
      "requestBodySchema",
      endpointHandler,
    )
  ) {
    expressApp[endpointHandler.method](
      endpointHandler.path,
      buildBodyValidatorMiddleware(endpointHandler.requestBodySchema),
    );
  }

  expressApp[endpointHandler.method](
    endpointHandler.path,
    buildApiEndpointHandler(endpointHandler),
  );
}

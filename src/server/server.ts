import express, { Application } from "express";
import { ApiEndpointHandler } from "./handlers/apiHandler";

export interface ServerOptions {
  port?: number;
}
export interface Server {
  _expressApp: Application;
  start: () => void;
  registerApiEndpoint: (endpointHandler: ApiEndpointHandler) => void;
}

export function createServer(options: ServerOptions): Server {
  const { port = 3000 } = options;

  const app = express();

  return {
    _expressApp: app,
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
  const { path, method, handler } = endpointHandler;

  expressApp[method](path, handler);
}

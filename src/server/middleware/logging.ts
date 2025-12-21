import colors from "colors/safe";
import { NextFunction, Request, Response } from "express";
import { Logger } from "../utils/logging";

export function buildRequestLogger(logger: Logger, isInDevMode: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.info(
      `[Request] ${colors.cyan(req.method)} - ${colors.cyan(req.path)}`,
    );

    if (isInDevMode) {
      logger.info(`[Request - Dev] Headers: ${JSON.stringify(req.headers)}`);
      logger.info(`[Request - Dev] Query: ${JSON.stringify(req.query)}`);
      logger.info(`[Request - Dev] Body: ${JSON.stringify(req.body)}`);
    }

    next();
  };
}

export function buildResponseLogger(logger: Logger, isInDevMode: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (body: unknown): Response {
      logger.info(
        `[Response] ${colors.cyan(req.method)} - ${colors.cyan(
          req.path,
        )} - Status: ${res.statusCode > 299 && res.statusCode < 599 ? colors.red(res.statusCode.toString()) : colors.green(res.statusCode.toString())}`,
      );

      if (isInDevMode) {
        logger.info(`[Response - Dev] Body: ${JSON.stringify(body)}`);
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { HttpStatusCodes } from "../constants/HttpStatusCodes.js";

export function buildBodyValidatorMiddleware<Schema extends ZodType>(
  schema: Schema,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    const validationResult = schema.safeParse(request.body);
    if (!validationResult.success) {
      response.status(HttpStatusCodes.BadRequest_400).json({
        message: `Body invalid`,
        error: validationResult.error,
      });
      return;
    }
    next();
  };
}

export function buildQueryValidatorMiddleware<Schema extends ZodType>(
  schema: Schema,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    const validationResult = schema.safeParse(request.query);
    if (!validationResult.success) {
      response.status(HttpStatusCodes.BadRequest_400).json({
        message: `Query parameters invalid`,
        error: validationResult.error,
      });
      return;
    }
    next();
  };
}

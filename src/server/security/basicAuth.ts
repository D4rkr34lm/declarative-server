import { Request } from "express";
import { hasNoValue } from "../utils/typeGuards";

export interface BasicAuthScheme<Caller = unknown> {
  name: string;
  type: "http";
  scheme: "basic";
  validateCaller: (
    username: string,
    password: string,
  ) => Promise<Caller | null>;
}

export function createBasicAuthSchema<Caller>(
  name: string,
  validateCaller: (
    username: string,
    password: string,
  ) => Promise<Caller | null>,
): BasicAuthScheme<Caller> {
  return {
    name,
    type: "http",
    scheme: "basic",
    validateCaller,
  };
}

export function buildBasicAuthenticator<Caller>(
  scheme: BasicAuthScheme<Caller>,
) {
  return async (request: Request): Promise<Caller | null> => {
    const authHeader = request.headers.authorization;

    if (hasNoValue(authHeader) || !authHeader.startsWith("Basic ")) {
      return null;
    }

    const base64Credentials = authHeader.slice("Basic ".length);
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [username, password] = credentials.split(":", 2);

    return scheme.validateCaller(username, password);
  };
}

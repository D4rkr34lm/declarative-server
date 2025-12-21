import { Request } from "express";
import { BasicAuthScheme, buildBasicAuthenticator } from "./basicAuth.js";
import { BearerAuthScheme, buildBearerAuthenticator } from "./bearerAuth.js";

export type SecurityScheme<Caller> =
  | BasicAuthScheme<Caller>
  | BearerAuthScheme<Caller>;

export async function authenticate<Caller>(
  schemes: SecurityScheme<Caller>[],
  request: Request,
): Promise<Caller | null> {
  const authenticationResults = await Promise.all(
    schemes.map((scheme) => {
      switch (scheme.scheme) {
        case "basic":
          return buildBasicAuthenticator(scheme)(request);
        case "bearer":
          return buildBearerAuthenticator(scheme)(request);
      }
    }),
  );

  const successfulAuthentication = authenticationResults.find(
    (result) => result !== null,
  );

  return successfulAuthentication ?? null;
}

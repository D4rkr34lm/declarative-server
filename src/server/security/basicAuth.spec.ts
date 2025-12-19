import testRequest from "supertest";
import { describe, it } from "vitest";
import { HttpStatusCodes } from "../constants/HttpStatusCodes";
import { createApiEndpointHandler } from "../handlers/api/createApiHandler";
import { testEndpointBase } from "../handlers/api/createApiHandler.spec";
import { createServer } from "../server";
import { createBasicAuthSchema } from "./basicAuth";

describe("basic auth schema", () => {
  const testUsername = "Test";
  const testPassword = "TestPW";

  const authScheme = createBasicAuthSchema(
    "TestAuth",
    async (name, password) => {
      if (name === testUsername && password === testPassword) {
        return {
          username: name,
        };
      } else {
        return null;
      }
    },
  );

  const endpoint = createApiEndpointHandler(
    {
      ...testEndpointBase,
      securitySchemes: [authScheme],
    },
    async () => {
      return { code: HttpStatusCodes.Ok_200 };
    },
  );

  const server = createServer({
    port: 3000,
    inDevMode: false,
    logger: false,
  });

  server.registerApiEndpoint(endpoint);

  it("accepts valid credentials", () => {
    testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Basic ${testUsername}:${testPassword}`)
      .expect(HttpStatusCodes.Ok_200);
  });

  it("rejectes invalid credentials", () => {
    testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Basic invalid:invalid`)
      .expect(HttpStatusCodes.Unauthorized_401);
  });
});

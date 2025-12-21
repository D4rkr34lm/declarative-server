import testRequest from "supertest";
import { describe, expect, it } from "vitest";
import { HttpStatusCodes } from "../constants/HttpStatusCodes";
import { createApiEndpointHandler } from "../handlers/api/createApiHandler";
import { testEndpointBase } from "../handlers/api/createApiHandler.spec";
import { createServer } from "../server";
import { createBasicAuthSchema } from "./basicAuth";

describe("basic auth schema", () => {
  const testUsername = "Test";
  const testPassword = "TestPW";

  const encodedCredentials = Buffer.from(
    `${testUsername}:${testPassword}`,
  ).toString("base64");

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
      return { code: HttpStatusCodes.Ok_200, data: "test" };
    },
  );

  const server = createServer({
    port: 3000,
    inDevMode: false,
    logger: false,
  });

  server.registerApiEndpoint(endpoint);

  it("accepts valid credentials", async () => {
    const response = await testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Basic ${encodedCredentials}`);

    expect(response.status).toBe(HttpStatusCodes.Ok_200);
  });

  it("rejects invalid credentials", async () => {
    const response = await testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Basic INVALID:INVALID`);

    expect(response.status).toBe(HttpStatusCodes.Unauthorized_401);
  });
});

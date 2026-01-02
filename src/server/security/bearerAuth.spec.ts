import testRequest from "supertest";
import { describe, expect, it } from "vitest";
import { HttpStatusCodes } from "../constants/HttpStatusCodes.js";
import { createApiEndpointHandler } from "../handlers/api/createApiHandler.js";
import { testEndpointBase } from "../handlers/api/createApiHandler.spec.js";
import { createServer } from "../server.js";
import { createBearerAuthSchema } from "./bearerAuth.js";

describe("bearer auth schema", () => {
  const testToken = "TestToken123";

  const authScheme = createBearerAuthSchema("TestAuth", async (token) => {
    if (token === testToken) {
      return {
        username: "TestUser",
      };
    } else {
      return null;
    }
  });

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

  it("accepts valid token", async () => {
    const response = await testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Bearer ${testToken}`);

    expect(response.status).toBe(HttpStatusCodes.Ok_200);
  });

  it("rejects invalid token", async () => {
    const response = await testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Bearer INVALID_TOKEN`);

    expect(response.status).toBe(HttpStatusCodes.Unauthorized_401);
  });

  it("rejects missing authorization header", async () => {
    const response = await testRequest(server.expressApp).get("/test");

    expect(response.status).toBe(HttpStatusCodes.Unauthorized_401);
  });

  it("rejects malformed authorization header", async () => {
    const response = await testRequest(server.expressApp)
      .get("/test")
      .set("Authorization", `Basic sometoken`);

    expect(response.status).toBe(HttpStatusCodes.Unauthorized_401);
  });
});

import { describe, expect, it } from "vitest";
import { createServer } from "../../server.js";
import { createApiEndpointHandler } from "./createApiHandler.js";

import testRequest from "supertest";
import z from "zod";
import { HttpMethods } from "../../constants/HttpMethods.js";

export const testEndpointBase = {
  meta: {
    name: "getTest",
    description: "Gets test element",
    group: "test",
  },
  method: HttpMethods.get,
  path: "/test",
  securitySchemes: [],
  responseSchemas: {
    200: {
      type: "json" as const,
      schema: z.string(),
    },
  },
};

describe("createApiHandler", () => {
  it("can create an API handler that responds correctly (json)", async () => {
    const endpoint = createApiEndpointHandler(
      {
        ...testEndpointBase,
      },
      async () => {
        return {
          code: 200,
          data: "test",
        };
      },
    );

    const server = createServer({
      inDevMode: true,
      port: 3000,
      logger: false,
    });

    server.registerApiEndpoint(endpoint);

    const response = await testRequest(server.expressApp).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe("test");
  });

  it("can create an API handler that responds with custom headers", async () => {
    const endpoint = createApiEndpointHandler(
      {
        ...testEndpointBase,
        responseSchemas: {
          200: {
            type: "json" as const,
            schema: z.string(),
            headers: ["X-Custom-Header"],
          },
        },
      },
      async () => {
        return {
          code: 200,
          data: "test",
          headers: {
            "X-Custom-Header": "CustomValue",
          },
        };
      },
    );

    const server = createServer({
      inDevMode: true,
      port: 3000,
      logger: false,
    });

    server.registerApiEndpoint(endpoint);

    const response = await testRequest(server.expressApp).get("/test");

    expect(response.status).toBe(200);
    expect(response.text).toBe("test");
    expect(response.headers["x-custom-header"]).toBe("CustomValue");
  });
});

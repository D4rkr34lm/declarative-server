import { describe, expect, it } from "vitest";
import { createServer } from "../../server";
import { createApiEndpointHandler } from "./createApiHandler";

import testRequest from "supertest";
import z from "zod";
import { HttpMethods } from "../../constants/HttpMethods";

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
  it("can create an API handler", async () => {
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
});

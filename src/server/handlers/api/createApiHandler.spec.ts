import { describe, it } from "vitest";
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
  requestBodySchema: z.object({
    name: z.string(),
  }),
  path: "/test",
  securitySchemes: [],
  responseSchemas: {
    200: {},
  },
};

describe("createApiHandler", () => {
  it("can create an API handler", () => {
    const endpoint = createApiEndpointHandler(
      {
        ...testEndpointBase,
      },
      async () => {
        return {
          code: 200,
        };
      },
    );

    const server = createServer({
      inDevMode: true,
      port: 3000,
      logger: false,
    });

    server.registerApiEndpoint(endpoint);

    testRequest(server.expressApp).get("/test").expect(200);
  });
});

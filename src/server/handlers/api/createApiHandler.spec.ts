import { describe, it } from "vitest";
import { createServer } from "../../server";
import { createApiEndpointHandler } from "./createApiHandler";

import testRequest from "supertest";

describe("createApiHandler", () => {
  it("can create an API handler", () => {
    const endpoint = createApiEndpointHandler(
      {
        meta: {
          name: "",
          description: "",
          group: "",
        },
        method: "get",
        path: "/test",
        responseSchemas: {
          200: {},
        },
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
      endpoints: [endpoint],
    });

    testRequest(server.expressApp).get("/test").expect(200);
  });
});

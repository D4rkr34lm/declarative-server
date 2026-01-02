import testRequest from "supertest";
import { describe, expect, it } from "vitest";
import { createServer } from "../server";
import { createApiEndpointHandler } from "../handlers/api/createApiHandler";
import z from "zod";
import { HttpStatusCodes } from "../constants/HttpStatusCodes";

describe("validation middleware", () => {
  const mockServer = createServer({
    port: 3000,
    inDevMode: false,
    logger: false,
  });

  const querySchema = z.object({
    time: z.iso.datetime(),
  });

  const bodySchema = z.object({
    age: z.number(),
  });

  const mockEndpoint = createApiEndpointHandler(
    {
      meta: {
        name: "",
        description: "",
        group: "",
      },
      method: "post",
      path: "/mock",
      querySchema: querySchema,
      requestBodySchema: bodySchema,
      securitySchemes: [],
      responseSchemas: {
        [HttpStatusCodes.Ok_200]: {
          type: "json",
          schema: z.object({
            time: z.string(),
            age: z.number(),
          }),
        },
      },
    },
    async ({ query, body }) => {
      return {
        code: HttpStatusCodes.Ok_200,
        data: {
          time: query.time,
          age: body.age,
        },
      };
    },
  );

  mockServer.registerApiEndpoint(mockEndpoint);

  const serverRequest = testRequest(mockServer.expressApp);

  it("validates request-body against schema", async () => {
    const date = new Date().toISOString();

    const response = await serverRequest
      .post("/mock")
      .send({ age: 30 })
      .query({ time: date });

    expect(response.status).toBe(HttpStatusCodes.Ok_200);
    expect(response.body).toEqual({ time: date, age: 30 });
  });

  it("rejects invalid request-body", async () => {
    const date = new Date().toISOString();

    const response = await serverRequest
      .post("/mock")
      .send({ age: "thirty" })
      .query({ time: date });

    expect(response.status).toBe(HttpStatusCodes.BadRequest_400);
    expect(response.body).toHaveProperty("message", "Body invalid");
  });

  it("rejects invalid query parameters", async () => {
    const response = await serverRequest
      .post("/mock")
      .send({ age: 25 })
      .query({ time: "a-b-c" });

    expect(response.status).toBe(HttpStatusCodes.BadRequest_400);
    expect(response.body).toHaveProperty("message", "Query parameters invalid");
  });
});

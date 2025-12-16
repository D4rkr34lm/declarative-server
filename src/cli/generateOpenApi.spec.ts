import { OpenAPIV3 } from "openapi-types";
import { describe, expect, it } from "vitest";
import z from "zod";
import { createApiEndpointHandler } from "../server";
import { __TEST_EXPORTS } from "./generateOpenApi";

const { translateToOpenAPIPathItem } = __TEST_EXPORTS;

describe("translateToOpenAPIPathItem", () => {
  it("should translate endpoint definitions to OpenAPI path items", () => {
    const { definition } = createApiEndpointHandler(
      {
        method: "get",
        path: "/users/:id",
        meta: {
          name: "getUser",
          description: "Retrieve a user by ID",
          group: "User",
        },
        responseSchemas: {
          200: {
            dataType: "application/json",
            dataSchema: z.string(),
          },
        },
      },
      async (req) => {
        return {
          code: 200,
          dataType: "application/json",
          json: req.params.id,
        };
      },
    );

    const [path, pathItem] = translateToOpenAPIPathItem(definition);

    const expectedPath = "/users/{id}";

    const expectedSchema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "string",
    };

    const expectedPathItem: OpenAPIV3.PathItemObject = {
      get: {
        operationId: "getUser",
        summary: "Retrieve a user by ID",
        tags: ["User"],
        description: "Retrieve a user by ID",
        parameters: [
          {
            description: "Path parameter :id",
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Response for status code 200",
            content: {
              "application/json": {
                schema: expectedSchema as OpenAPIV3.SchemaObject,
              },
            },
          },
        },
      },
    };

    expect(path).toBe(expectedPath);
    expect(pathItem).toEqual(expectedPathItem);
  });
});

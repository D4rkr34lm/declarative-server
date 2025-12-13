import { glob } from "glob";
import path from "path";
import z from "zod";
import { HttpMethod } from "../server/constants/HttpMethods";
import { ApiEndpointDefinition } from "../server/handlers/api/EndpointDefinition";
import { GenericResponseSchemaMap } from "../server/handlers/api/responses";
import { hasNoValue, hasValue } from "../server/utils/typeGuards";

import { ZodType } from "zod";

import { OpenAPIV3 } from "openapi-types";
import { isJsonResponseSchema } from "../server/handlers/api/responses/jsonResponse";

async function findEndpointDefinitions(targetPath: string) {
  const files = await glob("**/*.ts", {
    cwd: path.resolve(process.cwd(), targetPath),
    ignore: ["**/node_modules/**", "**/*.spec.ts"],
  });

  const definitions = await Promise.all(
    files.map(async (file) => {
      const absolutePath = path.resolve(file);
      const fileUrl = path.toNamespacedPath(absolutePath).startsWith("/")
        ? `file://${absolutePath}`
        : `file:///${absolutePath}`;

      try {
        const module = await import(fileUrl);
        if (
          module.default &&
          module.default.type === "__API_ENDPOINT_DEFINITION__"
        ) {
          const def = module.default.definition as
            | ApiEndpointDefinition<
                string,
                HttpMethod,
                z.ZodType | undefined,
                z.ZodType | undefined,
                GenericResponseSchemaMap
              >
            | undefined;

          if (hasNoValue(def)) {
            return null;
          }

          return def;
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error importing ${file}:`, error);
        return null;
      }
    }),
  );

  return definitions.filter(hasValue);
}

function extractPathAndParameters(path: string): {
  openApiPath: string;
  parameters: OpenAPIV3.ParameterObject[];
} {
  const parameters: OpenAPIV3.ParameterObject[] =
    path.match(/:([a-zA-Z0-9_]+)/g)?.map((param) => {
      return {
        name: param.substring(1),
        in: "path",
        required: true,
        schema: { type: "string" },
        description: `Path parameter ${param}`,
      };
    }) ?? [];

  const openApiPath = path.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
    return `{${paramName}}`;
  });

  return { openApiPath, parameters };
}

function extractQueryParameters(
  querySchema: ZodType,
): OpenAPIV3.ParameterObject[] {
  const querySchemaObject = z.toJSONSchema(querySchema);

  if (querySchemaObject.properties) {
    return Object.entries(querySchemaObject.properties).map(
      ([name, schema]) => ({
        name: name,
        in: "query",
        required: querySchemaObject.required?.includes(name) || false,
        schema: schema as OpenAPIV3.SchemaObject,
      }),
    );
  } else {
    return [];
  }
}

function translateToOpenAPIPathItem(
  definition: ApiEndpointDefinition<
    string,
    HttpMethod,
    ZodType | undefined,
    ZodType | undefined,
    GenericResponseSchemaMap
  >,
): [string, OpenAPIV3.PathItemObject] {
  const {
    meta,
    path,
    method,
    requestBodySchema,
    querySchema,
    responseSchemas,
  } = definition;

  // 1. Path and Parameter extraction
  const { openApiPath, parameters: pathParameters } =
    extractPathAndParameters(path);

  const queryParameters = hasValue(querySchema)
    ? extractQueryParameters(querySchema)
    : [];

  const operationParameters = [...pathParameters, ...queryParameters];

  const requestBody = hasValue(requestBodySchema)
    ? {
        requestBody: {
          description: `${meta.name} Request Body`,
          required: true,
          content: {
            "application/json": {
              schema: z.toJSONSchema(
                requestBodySchema,
              ) as OpenAPIV3.SchemaObject, // Type assertion
            },
          },
        },
      }
    : {};

  // 4. Response Schema Translation
  const responses = Object.entries(responseSchemas)
    .map(([statusCode, responseDef]) => {
      if (isJsonResponseSchema(responseDef)) {
        const zodSchema = responseDef.dataSchema as ZodType;
        const responseSchema = z.toJSONSchema(zodSchema);

        return {
          [statusCode]: {
            description: `Response for status code ${statusCode}`,
            content: {
              [responseDef.dataType]: {
                schema: responseSchema as OpenAPIV3.SchemaObject,
              },
            },
          } as OpenAPIV3.ResponseObject,
        };
      } else {
        return {
          [statusCode]: {
            description: `Response for status code ${statusCode}`,
          } as OpenAPIV3.ResponseObject,
        };
      }
    })
    .reduce((acc, resp) => {
      return { ...acc, ...resp };
    }, {});

  const operation: OpenAPIV3.OperationObject = {
    operationId: meta.name,
    summary: meta.description,
    tags: [meta.group],
    description: meta.description,
    parameters: operationParameters,
    ...requestBody,
    responses,
  };

  const pathItem: OpenAPIV3.PathItemObject = {
    [method.toLowerCase()]: operation,
  };

  return [openApiPath, pathItem];
}

export async function generateOpenApiDoc(targetPath: string) {
  const definitions = await findEndpointDefinitions(targetPath);

  const paths = definitions.reduce<OpenAPIV3.PathsObject>((acc, def) => {
    const [openApiPath, pathItem] = translateToOpenAPIPathItem(def);

    if (acc[openApiPath]) {
      acc[openApiPath] = {
        ...acc[openApiPath],
        ...pathItem,
      };
    } else {
      acc[openApiPath] = pathItem;
    }

    return acc;
  }, {});

  const openApiDocument: OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
      title: "Generated API",
      version: "1.0.0",
    },
    paths: paths,
  };

  return openApiDocument;
}

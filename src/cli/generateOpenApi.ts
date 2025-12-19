import z from "zod";
import { HttpMethod } from "../server/constants/HttpMethods";
import { ApiEndpointDefinition } from "../server/handlers/api/EndpointDefinition";
import { GenericResponseSchemaMap } from "../server/handlers/api/responses";
import { hasValue } from "../server/utils/typeGuards";

import { ZodType } from "zod";

import { OpenAPIV3 } from "openapi-types";
import path from "path";
import { isJsonResponseSchema } from "../server/handlers/api/responses/jsonResponse";

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

function extractRequestSecuritySchemes(
  definition: ApiEndpointDefinition,
): OpenAPIV3.SecurityRequirementObject[] {
  const securitySchemes = definition.securitySchemes;

  if (hasValue(securitySchemes)) {
    return securitySchemes.map((schema) => {
      switch (schema.type) {
        case "http":
          return {
            [schema.name]: [],
          } as OpenAPIV3.SecurityRequirementObject;
        default:
          throw new Error(`Unsupported security scheme type: ${schema.type}`);
      }
    });
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

  // 5. Security Requirements
  const securityRequirements = extractRequestSecuritySchemes(definition);

  const operation: OpenAPIV3.OperationObject = {
    operationId: meta.name,
    summary: meta.description,
    tags: [meta.group],
    description: meta.description,
    parameters: operationParameters,
    ...requestBody,
    responses,
    security: securityRequirements,
  };

  const pathItem: OpenAPIV3.PathItemObject = {
    [method.toLowerCase()]: operation,
  };

  return [openApiPath, pathItem];
}

function extractSecuritySchemes(
  endpointDefinitions: ApiEndpointDefinition[],
): OpenAPIV3.ComponentsObject["securitySchemes"] {
  const securitySchemes = Array.from(
    new Set(
      endpointDefinitions
        .map((def) => def.securitySchemes)
        .filter(hasValue)
        .flat(),
    ),
  );

  const openApiSecuritySchemes = securitySchemes.map((scheme) => {
    switch (scheme.type) {
      case "http":
        return {
          [scheme.name]: {
            type: "http",
            scheme: scheme.scheme,
          } as OpenAPIV3.HttpSecurityScheme,
        };
      default:
        throw new Error(`Unsupported security scheme type: ${scheme.type}`);
    }
  });

  return openApiSecuritySchemes.reduce((acc, scheme) => {
    return { ...acc, ...scheme };
  }, {});
}

export async function generateOpenApiDoc(targetPath: string) {
  const serverModule = await import(path.resolve(process.cwd(), targetPath));

  const server = serverModule.default;

  if (
    hasValue(server) &&
    hasValue(server.endpointDefinitions) &&
    Array.isArray(server.endpointDefinitions)
  ) {
    const endpointDefinitions: ApiEndpointDefinition<
      string,
      HttpMethod,
      ZodType,
      ZodType,
      GenericResponseSchemaMap
    >[] = server.endpointDefinitions;

    const paths = endpointDefinitions.reduce<OpenAPIV3.PathsObject>(
      (acc, def) => {
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
      },
      {},
    );

    const securitySchemes = extractSecuritySchemes(endpointDefinitions);

    const openApiDocument: OpenAPIV3.Document = {
      openapi: "3.0.0",
      info: {
        title: "Generated API",
        version: "1.0.0",
      },
      paths: paths,
      components: {
        securitySchemes,
      },
    };

    return openApiDocument;
  } else {
    throw new Error(
      "The specified module does not export a valid server instance.",
    );
  }
}

export const __TEST_EXPORTS = {
  translateToOpenAPIPathItem,
};

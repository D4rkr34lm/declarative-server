import z from "zod";
import { HttpMethod } from "../server/constants/HttpMethods.js";
import { ApiEndpointDefinition } from "../server/handlers/api/EndpointDefinition.js";
import { GenericResponseSchemaMap } from "../server/handlers/api/responses/index.js";
import { hasValue } from "../server/utils/typeGuards.js";

import { ZodType } from "zod";

import { OpenAPIV3 } from "openapi-types";
import { isJsonResponseSchema } from "../server/handlers/api/responses/jsonResponse.js";
import { Server } from "../server/server.js";

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
  const querySchemaObject = z.toJSONSchema(querySchema, {
    io: "input",
    target: "openapi-3.0",
  });

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
              schema: z.toJSONSchema(requestBodySchema, {
                io: "input",
                target: "openapi-3.0",
              }) as OpenAPIV3.SchemaObject, // Type assertion
            },
          },
        },
      }
    : {};

  // 4. Response Schema Translation
  const responses = Object.entries(responseSchemas)
    .map(([statusCode, responseDef]) => {
      if (isJsonResponseSchema(responseDef)) {
        const zodSchema = responseDef.schema as ZodType;
        const responseSchema = z.toJSONSchema(zodSchema, {
          io: "input",
          target: "openapi-3.0",
        });

        return {
          [statusCode]: {
            description: `Response for status code ${statusCode}`,
            content: {
              ["application/json"]: {
                schema: responseSchema as OpenAPIV3.SchemaObject,
              },
            },
          } as OpenAPIV3.ResponseObject,
        };
      } else {
        throw new Error(`Unsupported response schema type: ${responseDef}`);
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

interface GeneratorOptions {
  title: string;
  version: string;
  description?: string;
  servers?: OpenAPIV3.ServerObject[];
  contact?: OpenAPIV3.ContactObject;
  license?: OpenAPIV3.LicenseObject;
}

export async function generateOpenApiDoc(
  server: Server,
  options: GeneratorOptions,
): Promise<OpenAPIV3.Document> {
  const endpointDefinitions = server.endpointDefinitions;

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
      title: options.title,
      version: options.version,
      description: options.description,
      license: options.license,
      contact: options.contact,
    },
    servers: options.servers ?? [],
    paths: paths,
    components: {
      securitySchemes,
    },
  };

  return openApiDocument;
}

export const __TEST_EXPORTS = {
  translateToOpenAPIPathItem,
};

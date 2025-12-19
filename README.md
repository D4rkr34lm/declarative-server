# transit-kit

[![CI](https://github.com/D4rkr34lm/transit-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/D4rkr34lm/transit-kit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/D4rkr34lm/transit-kit/badge.svg?branch=main)](https://coveralls.io/github/D4rkr34lm/transit-kit?branch=main)

A declarative TypeScript framework for building type-safe Express.js APIs with automatic OpenAPI generation.

## Features

- 🔒 **Type-Safe**: End-to-end type safety with TypeScript and Zod validation
- 📝 **Declarative API Definition**: Define your endpoints with clear, declarative syntax
- 🔄 **Automatic Validation**: Request body and query parameter validation using Zod schemas
- 📚 **OpenAPI Generation**: Automatically generate OpenAPI documentation from your endpoint definitions
- ⚡ **Express.js Powered**: Built on top of the battle-tested Express.js framework
- 🪵 **Built-in Logging**: Request and response logging out of the box
- 🎯 **Path Parameters**: Full support for path parameters with type safety

## Installation

```bash
npm install transit-kit
```

## Quick Start

### 1. Create a Server

```typescript
import { createServer } from "transit-kit/server";

const server = createServer({
  port: 3000,
  inDevMode: true,
  logger: true, // or pass a custom logger (console-like interface)
});
```

### 2. Define an API Endpoint

```typescript
import { createApiEndpointHandler } from "transit-kit/server";
import z from "zod";

// Define a simple GET endpoint
const getUserEndpoint = createApiEndpointHandler(
  {
    meta: {
      name: "Get User",
      description: "Retrieves a user by ID",
      group: "Users",
    },
    method: "get",
    path: "/users/:userId",
    responseSchemas: {
      200: {
        dataType: "application/json",
        dataSchema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
        }),
      },
      404: {}, // Empty response
    },
  },
  async (request) => {
    const { userId } = request.params;

    // Simulate fetching user
    const user = await fetchUser(userId);

    if (!user) {
      return {
        code: 404,
      };
    }

    return {
      code: 200,
      dataType: "application/json",
      json: user,
    };
  },
);
```

### 3. Define an Endpoint with Request Body and Query Parameters

```typescript
const createUserEndpoint = createApiEndpointHandler(
  {
    meta: {
      name: "Create User",
      description: "Creates a new user",
      group: "Users",
    },
    method: "post",
    path: "/users",
    requestBodySchema: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(18),
    }),
    querySchema: z.object({
      notify: z.boolean().optional(),
    }),
    responseSchemas: {
      201: {
        dataType: "application/json",
        dataSchema: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string().email(),
        }),
      },
      400: {
        dataType: "application/json",
        dataSchema: z.object({
          error: z.string(),
        }),
      },
    },
  },
  async (request) => {
    // Request body is automatically validated and typed
    const { name, email, age } = request.body;
    const { notify } = request.query;

    try {
      const newUser = await createUser({ name, email, age });

      if (notify) {
        await sendNotification(email);
      }

      return {
        code: 201,
        dataType: "application/json",
        json: newUser,
      };
    } catch (error) {
      return {
        code: 400,
        dataType: "application/json",
        json: { error: error.message },
      };
    }
  },
);
```

### 4. Register Endpoints and Start Server

```typescript
server.registerApiEndpoint(getUserEndpoint);
server.registerApiEndpoint(createUserEndpoint);

server.start();
```

## Authentication

Transit-kit includes a simple, composable authentication mechanism based on `Authorization` headers. You declare one or more `SecurityScheme`s on an endpoint, and the framework will:

- Apply an authentication middleware for that endpoint
- Try all declared schemes in order and pick the first successful one
- Return `401 Unauthorized` automatically when authentication fails
- Inject the authenticated `caller` into your endpoint handler

### Basic Auth

Supports `Authorization: Basic <base64(username:password)>`.

```typescript
import {
  createApiEndpointHandler,
  createServer,
} from "transit-kit/server";
import { createBasicAuthSchema } from "transit-kit/server/security/basicAuth";
import z from "zod";

// Define the shape of the authenticated caller
type Caller = { id: string; role: "admin" | "user" };

// Your validation logic (DB lookup, etc.)
const basicAuth = createBasicAuthSchema<Caller>(
  "basic",
  async (username, password) => {
    const user = await findUserByUsername(username);
    if (!user) return null;
    const ok = await verifyPassword(password, user.passwordHash);
    return ok ? { id: user.id, role: user.role } : null;
  },
);

const getProfile = createApiEndpointHandler(
  {
    meta: { name: "Get Profile", description: "Returns caller profile", group: "Auth" },
    method: "get",
    path: "/me",
    responseSchemas: {
      200: {
        dataType: "application/json",
        dataSchema: z.object({ id: z.string(), role: z.enum(["admin", "user"]) }),
      },
      401: {},
    },
    // Enable authentication for this endpoint
    securitySchemes: [basicAuth],
  },
  async (_req, { caller }) => {
    // `caller` is typed from your security scheme
    return { code: 200, dataType: "application/json", json: caller };
  },
);

const server = createServer({ port: 3000, inDevMode: true, logger: true });
server.registerApiEndpoint(getProfile);
server.start();
```

### Bearer Token Auth

Supports `Authorization: Bearer <token>`.

```typescript
import { createBearerAuthSchema } from "transit-kit/server/security/bearerAuth";

type Caller = { id: string; scopes: string[] };

const bearerAuth = createBearerAuthSchema<Caller>(
  "bearer",
  async (token) => {
    const payload = await verifyJwt(token); // or call your token introspection service
    return payload ? { id: payload.sub, scopes: payload.scopes } : null;
  },
);

const getSecret = createApiEndpointHandler(
  {
    meta: { name: "Get Secret", description: "Protected resource", group: "Auth" },
    method: "get",
    path: "/secret",
    responseSchemas: {
      200: { dataType: "application/json", dataSchema: z.object({ secret: z.string() }) },
      401: {},
    },
    securitySchemes: [bearerAuth],
  },
  async (_req, { caller }) => {
    // Use `caller.scopes` for authorization decisions
    return { code: 200, dataType: "application/json", json: { secret: "shh" } };
  },
);
```

### Multiple Schemes per Endpoint

You can allow multiple authentication methods on the same endpoint. The framework tries them in the order you specify and picks the first successful scheme.

```typescript
const endpoint = createApiEndpointHandler(
  {
    meta: { name: "Hybrid Auth", description: "Basic or Bearer", group: "Auth" },
    method: "get",
    path: "/hybrid",
    responseSchemas: { 200: { dataType: "application/json", dataSchema: z.object({ ok: z.boolean() }) }, 401: {} },
    securitySchemes: [basicAuth, bearerAuth],
  },
  async (_req, { caller }) => {
    // `caller` resolves from whichever scheme authenticated successfully
    return { code: 200, dataType: "application/json", json: { ok: true } };
  },
);
```

### How It Works

- Authentication middleware is built automatically per-endpoint when `securitySchemes` are present.
- Internals use `authenticate()` from [src/server/security/SecuritySchema.ts](src/server/security/SecuritySchema.ts) to try each scheme.
- Basic auth reads and decodes the header in [src/server/security/basicAuth.ts](src/server/security/basicAuth.ts).
- Bearer auth reads the header in [src/server/security/bearerAuth.ts](src/server/security/bearerAuth.ts).
- On success, the authenticated `caller` is stored and passed to your handler as `extractedRequestData.caller`.
- On failure, the framework responds with `401` and a JSON `{ message: "Unauthorized" }` from [src/server/middleware/auth.ts](src/server/middleware/auth.ts).

## Response Types

### JSON Response

For endpoints that return JSON data:

```typescript
return {
  code: 200,
  dataType: "application/json",
  json: { message: "Success", data: myData },
};
```

### Empty Response

For endpoints that return no content (e.g., 204 No Content):

```typescript
return {
  code: 204,
};
```

## OpenAPI Generation

Transit-kit can automatically generate OpenAPI documentation from your endpoint definitions.

### Using the CLI

```bash
npx transit-kit generate-openapi --output openapi.json --target ./src
```

Options:

- `-o, --output <path>`: Output path for the generated OpenAPI document (default: `openapi.json`)
- `-t, --target <path>`: Target path to search for endpoint definitions (default: `.`)

### Programmatic Usage

```typescript
import { generateOpenApiDoc } from "transit-kit/cli";

const openApiDoc = await generateOpenApiDoc("./src");
```

The generated OpenAPI document will include:

- All registered endpoints
- Request/response schemas
- Path parameters
- Query parameters
- Request body schemas
- Response schemas for all status codes

## Configuration

### Server Configuration

```typescript
interface ServerConfig {
  inDevMode: boolean; // Enable development mode features
  port: number; // Port to listen on
  logger: Logger | boolean; // Logger instance or boolean to enable/disable
}
```

### Custom Logger

You can provide a custom logger with a console-like interface:

```typescript
const customLogger = {
  log: (message: string) => {
    /* custom logging */
  },
  error: (message: string) => {
    /* custom error logging */
  },
  // ... other console methods
};

const server = createServer({
  port: 3000,
  inDevMode: false,
  logger: customLogger,
});
```

## API Reference

### `createServer(config: ServerConfig): Server`

Creates a new server instance with the specified configuration.

### `createApiEndpointHandler(definition, handler)`

Creates an API endpoint handler with type-safe request/response handling.

**Definition properties:**

- `meta`: Metadata about the endpoint (name, description, group)
- `method`: HTTP method (`get`, `post`, `put`, `patch`, `delete`)
- `path`: Express-style path with optional parameters (e.g., `/users/:userId`)
- `requestBodySchema`: (Optional) Zod schema for request body validation
- `querySchema`: (Optional) Zod schema for query parameter validation
- `responseSchemas`: Map of status codes to response schemas

### `server.registerApiEndpoint(endpoint)`

Registers an endpoint with the server.

### `server.start()`

Starts the Express server on the configured port.

## Examples

### Complete Example

```typescript
import { createServer, createApiEndpointHandler } from "transit-kit/server";
import z from "zod";

// Create server
const server = createServer({
  port: 3000,
  inDevMode: true,
  logger: true,
});

// Define endpoints
const listUsersEndpoint = createApiEndpointHandler(
  {
    meta: {
      name: "List Users",
      description: "Get a list of all users",
      group: "Users",
    },
    method: "get",
    path: "/users",
    querySchema: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
    responseSchemas: {
      200: {
        dataType: "application/json",
        dataSchema: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
          }),
        ),
      },
    },
  },
  async (request) => {
    const { page = 1, limit = 10 } = request.query;
    const users = await fetchUsers(page, limit);

    return {
      code: 200,
      dataType: "application/json",
      json: users,
    };
  },
);

server.registerApiEndpoint(listUsersEndpoint);
server.start();
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

D4rkr34lm

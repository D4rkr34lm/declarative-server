# Transit-Kit

[![CI](https://github.com/D4rkr34lm/transit-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/D4rkr34lm/transit-kit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/D4rkr34lm/transit-kit/badge.svg?branch=main)](https://coveralls.io/github/D4rkr34lm/transit-kit?branch=main)
[![npm version](https://badge.fury.io/js/transit-kit.svg)](https://www.npmjs.com/package/transit-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)

A **declarative TypeScript framework** for building end-to-end type-safe REST APIs with Express.js and automatic OpenAPI documentation generation.

## Why Transit-Kit?

Transit-Kit brings modern type-safety and developer experience to Express.js without abandoning the familiar, battle-tested foundation you already know. It's built on minimalism:

- 🎯 **Express at its core** — Use the familiar Express API you already know
- 🔒 **End-to-end type safety** — Full TypeScript inference from request to response
- 📝 **Auto-generated OpenAPI** — Documentation that stays in sync with your code
- ✅ **Zod validation** — Runtime type checking with zero boilerplate
- 🪶 **Minimal overhead** — Thin layer over Express, not a complete rewrite
-  **Declarative definitions** — Define endpoints declaratively with full type info

## Requirements

- **Node.js 22+**
- **TypeScript 5.9+**

## Installation

```bash
npm install transit-kit
```

```bash
yarn add transit-kit
```

```bash
pnpm add transit-kit
```

## Quick Start

```typescript
import { createServer } from "transit-kit/server";
import { createApiEndpointHandler } from "transit-kit/server";
import { z } from "zod";

// Create a server
const server = createServer({
  port: 3000,
  inDevMode: true,
  logger: true,
});

// Define a simple endpoint
const helloEndpoint = createApiEndpointHandler(
  {
    meta: {
      name: "sayHello",
      group: "Greetings",
      description: "Returns a greeting message",
    },
    path: "/hello/:name",
    method: "get",
    responseSchemas: {
      200: {
        type: "json",
        schema: z.object({
          message: z.string(),
        }),
      },
    },
    securitySchemes: [],
  },
  async ({ parameters }) => {
    return {
      code: 200,
      data: {
        message: `Hello, ${parameters.name}!`,
      },
    };
  }
);

// Register and start
server.registerApiEndpoint(helloEndpoint);
server.start();
```

## Core Concepts

### 1. Endpoint Definitions

Every API endpoint in Transit-Kit is defined declaratively with full type information:

```typescript
const definition = {
  meta: {
    name: "createUser",           // Unique operation ID
    group: "Users",                // OpenAPI tag
    description: "Create a user"  // Endpoint description
  },
  path: "/users",                  // Express-style path
  method: "post",                  // HTTP method
  requestBodySchema: z.object({    // Request validation (optional)
    name: z.string(),
    email: z.string().email(),
  }),
  querySchema: z.object({          // Query params validation (optional)
    sendEmail: z.boolean().optional(),
  }),
  responseSchemas: {               // All possible responses
    201: {
      type: "json",
      schema: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
    },
    400: {
      type: "json",
      schema: z.object({
        error: z.string(),
      }),
    },
  },
  securitySchemes: [],             // Auth schemes (if any)
};
```

### 2. Type-Safe Handlers

Handlers automatically infer types from your endpoint definition:

```typescript
const handler = async ({ body, query, parameters }) => {
  // body is typed as { name: string, email: string }
  // query is typed as { sendEmail?: boolean }
  // parameters are inferred from the path pattern
  
  const user = await createUserInDatabase(body);
  
  return {
    code: 201,
    data: user,  // Must match the response schema for code 201
  };
};
```

### 3. Server Registration

Combine definitions and handlers, then register with your server:

```typescript
const endpoint = createApiEndpointHandler(definition, handler);
server.registerApiEndpoint(endpoint);
```

## Example: CRUD API

Here's a complete example showing a REST API for managing todos:

```typescript
import { createServer, createApiEndpointHandler } from "transit-kit/server";
import { z } from "zod";

const server = createServer({
  port: 3000,
  inDevMode: true,
  logger: true,
});

// In-memory storage (use a real database in production)
const todos: Map<string, { id: string; title: string; completed: boolean }> = new Map();

// Schemas
const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

const CreateTodoSchema = z.object({
  title: z.string().min(1),
});

// CREATE
const createTodo = createApiEndpointHandler(
  {
    meta: {
      name: "createTodo",
      group: "Todos",
      description: "Create a new todo item",
    },
    path: "/todos",
    method: "post",
    requestBodySchema: CreateTodoSchema,
    responseSchemas: {
      201: {
        type: "json",
        schema: TodoSchema,
      },
    },
    securitySchemes: [],
  },
  async ({ body }) => {
    const id = crypto.randomUUID();
    const todo = {
      id,
      title: body.title,
      completed: false,
    };
    todos.set(id, todo);

    return {
      code: 201,
      data: todo,
    };
  }
);

// READ (List)
const listTodos = createApiEndpointHandler(
  {
    meta: {
      name: "listTodos",
      group: "Todos",
      description: "Get all todo items",
    },
    path: "/todos",
    method: "get",
    responseSchemas: {
      200: {
        type: "json",
        schema: z.object({
          todos: z.array(TodoSchema),
        }),
      },
    },
    securitySchemes: [],
  },
  async () => {
    return {
      code: 200,
      data: {
        todos: Array.from(todos.values()),
      },
    };
  }
);

// READ (Single)
const getTodo = createApiEndpointHandler(
  {
    meta: {
      name: "getTodo",
      group: "Todos",
      description: "Get a specific todo item",
    },
    path: "/todos/:id",
    method: "get",
    responseSchemas: {
      200: {
        type: "json",
        schema: TodoSchema,
      },
      404: {
        type: "json",
        schema: z.object({ error: z.string() }),
      },
    },
    securitySchemes: [],
  },
  async ({ parameters }) => {
    const todo = todos.get(parameters.id);
    
    if (!todo) {
      return {
        code: 404,
        data: { error: "Todo not found" },
      };
    }

    return {
      code: 200,
      data: todo,
    };
  }
);

// UPDATE
const updateTodo = createApiEndpointHandler(
  {
    meta: {
      name: "updateTodo",
      group: "Todos",
      description: "Update a todo item",
    },
    path: "/todos/:id",
    method: "put",
    requestBodySchema: z.object({
      title: z.string().optional(),
      completed: z.boolean().optional(),
    }),
    responseSchemas: {
      200: {
        type: "json",
        schema: TodoSchema,
      },
      404: {
        type: "json",
        schema: z.object({ error: z.string() }),
      },
    },
    securitySchemes: [],
  },
  async ({ parameters, body }) => {
    const todo = todos.get(parameters.id);
    
    if (!todo) {
      return {
        code: 404,
        data: { error: "Todo not found" },
      };
    }

    const updated = {
      ...todo,
      ...body,
    };
    todos.set(parameters.id, updated);

    return {
      code: 200,
      data: updated,
    };
  }
);

// DELETE
const deleteTodo = createApiEndpointHandler(
  {
    meta: {
      name: "deleteTodo",
      group: "Todos",
      description: "Delete a todo item",
    },
    path: "/todos/:id",
    method: "delete",
    responseSchemas: {
      204: {
        type: "json",
        schema: z.object({}),
      },
      404: {
        type: "json",
        schema: z.object({ error: z.string() }),
      },
    },
    securitySchemes: [],
  },
  async ({ parameters }) => {
    const exists = todos.has(parameters.id);
    
    if (!exists) {
      return {
        code: 404,
        data: { error: "Todo not found" },
      };
    }

    todos.delete(parameters.id);

    return {
      code: 204,
      data: {},
    };
  }
);

// Register all endpoints
server.registerApiEndpoint(createTodo);
server.registerApiEndpoint(listTodos);
server.registerApiEndpoint(getTodo);
server.registerApiEndpoint(updateTodo);
server.registerApiEndpoint(deleteTodo);

server.start();
console.log("Server running on http://localhost:3000");
```

## Authentication

Transit-Kit supports **Basic** and **Bearer** authentication schemes out of the box.

### Basic Authentication

```typescript
import { createBasicAuthSchema } from "transit-kit/server";

// Define your user type
interface User {
  id: string;
  username: string;
  role: string;
}

// Create an auth scheme
const basicAuth = createBasicAuthSchema<User>(
  "basicAuth",
  async (username, password) => {
    // Validate credentials (use your database)
    if (username === "admin" && password === "secret") {
      return {
        id: "1",
        username: "admin",
        role: "admin",
      };
    }
    return null; // Invalid credentials
  }
);
```

### Bearer Authentication

```typescript
import { createBearerAuthSchema } from "transit-kit/server";

const bearerAuth = createBearerAuthSchema<User>(
  "bearerAuth",
  async (token) => {
    // Validate token (e.g., JWT verification)
    const user = await verifyJWT(token);
    return user; // or null if invalid
  }
);
```

### Protected Endpoints

```typescript
const protectedEndpoint = createApiEndpointHandler(
  {
    meta: {
      name: "getProfile",
      group: "Users",
      description: "Get current user profile",
    },
    path: "/profile",
    method: "get",
    responseSchemas: {
      200: {
        type: "json",
        schema: z.object({
          id: z.string(),
          username: z.string(),
          role: z.string(),
        }),
      },
      401: {
        type: "json",
        schema: z.object({ error: z.string() }),
      },
    },
    securitySchemes: [basicAuth], // Require authentication
  },
  async ({ caller }) => {
    // caller is typed as User | null
    if (!caller) {
      return {
        code: 401,
        data: { error: "Unauthorized" },
      };
    }

    return {
      code: 200,
      data: caller, // Fully typed user object
    };
  }
);

server.registerApiEndpoint(protectedEndpoint);
```

### Multiple Auth Schemes

You can support multiple authentication methods:

```typescript
const endpoint = createApiEndpointHandler(
  {
    // ... other config
    securitySchemes: [basicAuth, bearerAuth], // Accept either
  },
  async ({ caller }) => {
    // caller will be set if any scheme succeeds
    // ...
  }
);
```

## OpenAPI Documentation

Transit-Kit automatically generates OpenAPI 3.0 documentation from your endpoint definitions.

```typescript
import { generateOpenApiDoc } from "transit-kit/generator";

const openApiDoc = await generateOpenApiDoc(server, {
  title: "My API",
  version: "1.0.0",
  description: "A type-safe REST API built with Transit-Kit",
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://api.example.com",
      description: "Production server",
    },
  ],
  contact: {
    name: "API Support",
    email: "support@example.com",
  },
  license: {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  },
});

// Serve the OpenAPI spec
server.expressApp.get("/openapi.json", (req, res) => {
  res.json(openApiDoc);
});

// Or write to file
import { writeFileSync } from "fs";
writeFileSync("./openapi.json", JSON.stringify(openApiDoc, null, 2));
```

The generated OpenAPI document includes:
- All endpoints with request/response schemas
- Path and query parameters
- Request body validation schemas
- Security requirements
- Response schemas for all status codes

You can use this with tools like:
- **Swagger UI** for interactive documentation
- **Postman** for API testing
- **OpenAPI Generator** for client SDK generation

## API Reference

### Server

#### `createServer(config: ServerConfig): Server`

Creates a new Transit-Kit server instance.

**Config Options:**
- `port: number` — Port to listen on
- `inDevMode: boolean` — Enable development mode (detailed logging)
- `logger: Logger | boolean` — Custom logger or true/false for console/no logging

**Returns:** Server instance with:
- `expressApp: Application` — Underlying Express app
- `registerApiEndpoint(endpoint)` — Register an API endpoint
- `start()` — Start the server
- `endpointDefinitions` — Array of registered endpoint definitions

### Endpoint Creation

#### `createApiEndpointHandler(definition, handler)`

Creates a type-safe API endpoint.

**Parameters:**
- `definition` — Endpoint definition object
- `handler` — Async function handling the request

**Handler receives:**
- `request` — Express Request object
- `response` — Express Response object
- `parameters` — Type-safe path parameters
- `query` — Type-safe query parameters
- `body` — Type-safe request body
- `caller` — Authenticated user (if auth is enabled)

### Authentication

#### `createBasicAuthSchema<Caller>(name, validateCaller)`

Creates a Basic authentication scheme.

**Parameters:**
- `name: string` — Unique name for the scheme
- `validateCaller: (username, password) => Promise<Caller | null>` — Validation function

#### `createBearerAuthSchema<Caller>(name, validateCaller)`

Creates a Bearer token authentication scheme.

**Parameters:**
- `name: string` — Unique name for the scheme
- `validateCaller: (token) => Promise<Caller | null>` — Validation function

### OpenAPI Generation

#### `generateOpenApiDoc(server, options): Promise<OpenAPIV3.Document>`

Generates OpenAPI 3.0 documentation.

**Parameters:**
- `server: Server` — Your Transit-Kit server instance
- `options: GeneratorOptions` — OpenAPI metadata

**Options:**
- `title: string` — API title
- `version: string` — API version
- `description?: string` — API description
- `servers?: ServerObject[]` — Server URLs
- `contact?: ContactObject` — Contact information
- `license?: LicenseObject` — License information

## Response Types

Transit-Kit currently supports JSON responses:

```typescript
{
  type: "json",
  schema: z.object({ /* your schema */ }),
  headers?: ["X-Custom-Header"], // Optional custom headers
}
```

When using custom headers in your response schema, you must include them in the handler response:

```typescript
return {
  code: 200,
  data: { /* ... */ },
  headers: {
    "X-Custom-Header": "value",
  },
};
```

## Accessing Express Features

Since Transit-Kit is built on Express, you can access the underlying Express app:

```typescript
const server = createServer({ /* ... */ });

// Add custom middleware
server.expressApp.use(cors());
server.expressApp.use(helmet());

// Static files
server.expressApp.use(express.static("public"));

// Custom routes
server.expressApp.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
```

## Project Structure

Transit-Kit exports two main modules:

- **`transit-kit/server`** — Server creation, endpoint handlers, and authentication
- **`transit-kit/generator`** — OpenAPI documentation generation

## TypeScript Configuration

For the best experience, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "target": "ES2022",
    "module": "ES2022"
  }
}
```

## License

MIT © [D4rkr34lm](https://github.com/D4rkr34lm)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [GitHub Repository](https://github.com/D4rkr34lm/transit-kit)
- [npm Package](https://www.npmjs.com/package/transit-kit)
- [Report Issues](https://github.com/D4rkr34lm/transit-kit/issues)

import { Request, Response } from "express";
import { describe, expectTypeOf, it } from "vitest";
import z from "zod";
import { BasicAuthScheme } from "../../security/basicAuth";
import { BearerAuthScheme } from "../../security/bearerAuth";
import { HandlerForDefinition } from "./HandlerFromDefinition";

describe("HandlerFromDefinition", () => {
  it("can infer handler responses correctly (Json)", () => {
    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {
          type: "json";
          schema: z.ZodString;
        };
      }
    >;

    type Expected = (typedRequestData: {
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >;
      response: Response<unknown>;
      parameters: {};
      query: undefined;
      body: undefined;
      caller: unknown;
    }) => Promise<{
      code: 200;
      data: string;
    }>;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });

  it("can infer handler responses correctly (headers)", () => {
    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {
          type: "json";
          schema: z.ZodString;
          headers: ["X-Custom-Header"];
        };
      }
    >;

    type Expected = (typedRequestData: {
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >;
      response: Response<unknown>;
      parameters: {};
      query: undefined;
      body: undefined;
      caller: unknown;
    }) => Promise<{
      code: 200;
      data: string;
      headers: {
        "X-Custom-Header": string;
      };
    }>;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });

  it("can infer caller from auth schema (Basic)", () => {
    type Caller = {
      name: string;
    };

    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {
          type: "json";
          schema: z.ZodString;
        };
      },
      [BasicAuthScheme<Caller>]
    >;

    type Expected = (typedRequestData: {
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >;
      response: Response<unknown>;
      parameters: {};
      query: undefined;
      body: undefined;
      caller: Caller;
    }) => Promise<{
      code: 200;
      data: string;
    }>;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });

  it("can infer caller from auth schema (Bearer)", () => {
    type Caller = {
      name: string;
    };

    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {
          type: "json";
          schema: z.ZodString;
        };
      },
      [BearerAuthScheme<Caller>]
    >;

    type Expected = (typedRequestData: {
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >;
      response: Response<unknown>;
      parameters: {};
      query: undefined;
      body: undefined;
      caller: Caller;
    }) => Promise<{
      code: 200;
      data: string;
    }>;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });
});

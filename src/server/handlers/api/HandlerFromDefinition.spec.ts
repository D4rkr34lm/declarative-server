import { Request } from "express";
import { describe, expectTypeOf, it } from "vitest";
import z from "zod";
import { BasicAuthScheme } from "../../security/basicAuth";
import { BearerAuthScheme } from "../../security/bearerAuth";
import { HandlerForDefinition } from "./HandlerFromDefinition";

describe("HandlerFromDefinition", () => {
  it("can infer handler responses correctly (Empty)", () => {
    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {};
      }
    >;

    type Expected = (
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >,
      extractedRequestData: {
        parameters: {};
        query: undefined;
        body: undefined;
        caller: unknown;
      },
    ) => Promise<
      | {
          code: 200;
        }
      | {
          code: 500;
        }
    >;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });

  it("can infer handler responses correctly (Json)", () => {
    const _data = z.object({
      a: z.number(),
    });

    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {
          dataType: "application/json";
          dataSchema: typeof _data;
        };
      }
    >;

    type Expected = (
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >,
      extractedRequestData: {
        parameters: {};
        query: undefined;
        body: undefined;
        caller: unknown;
      },
    ) => Promise<
      | {
          code: 200;
          dataType: "application/json";
          json: {
            a: number;
          };
        }
      | {
          code: 500;
        }
    >;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });

  it("can infer handler responses correctly (Multiple)", () => {
    const _data = z.object({
      a: z.number(),
    });

    type Handler = HandlerForDefinition<
      "/test",
      undefined,
      undefined,
      {
        200: {
          dataType: "application/json";
          dataSchema: typeof _data;
        };
        400: {};
      }
    >;

    type Expected = (
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >,
      extractedRequestData: {
        parameters: {};
        query: undefined;
        body: undefined;
        caller: unknown;
      },
    ) => Promise<
      | {
          code: 200;
          dataType: "application/json";
          json: {
            a: number;
          };
        }
      | { code: 400 }
      | {
          code: 500;
        }
    >;

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
        200: {};
      },
      [BasicAuthScheme<Caller>]
    >;

    type Expected = (
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >,
      extractedRequestData: {
        parameters: {};
        query: undefined;
        body: undefined;
        caller: Caller;
      },
    ) => Promise<
      | {
          code: 200;
        }
      | {
          code: 500;
        }
    >;

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
        200: {};
      },
      [BearerAuthScheme<Caller>]
    >;

    type Expected = (
      request: Request<
        {},
        unknown,
        undefined,
        undefined,
        Record<string, unknown>
      >,
      extractedRequestData: {
        parameters: {};
        query: undefined;
        body: undefined;
        caller: Caller;
      },
    ) => Promise<
      | {
          code: 200;
        }
      | {
          code: 500;
        }
    >;

    expectTypeOf<Handler>().toEqualTypeOf<Expected>();
  });
});

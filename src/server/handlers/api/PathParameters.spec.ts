import { describe, expectTypeOf, it } from "vitest";
import { ExtractPathParams } from "./PathParameters.js";

describe("ExtractPathParameters", () => {
  it("can infer the parameter types of a path", () => {
    type Path = "/test/path/with/:testId";
    type ParamObject = ExtractPathParams<Path>;

    expectTypeOf<ParamObject>().toEqualTypeOf<{ testId: string }>();
  });

  it("can infer multiple params", () => {
    type Path = "/test/path/with/:testId/and/:otherId";
    type ParamObject = ExtractPathParams<Path>;

    expectTypeOf<ParamObject>().toEqualTypeOf<{
      testId: string;
      otherId: string;
    }>();
  });

  it("can infer correctly if no param is present", () => {
    type Path = "/test/path/without";
    type ParamObject = ExtractPathParams<Path>;

    expectTypeOf<ParamObject>().toEqualTypeOf<{}>();
  });
});

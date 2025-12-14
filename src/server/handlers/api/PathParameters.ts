export type ExtractPathParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? {
        [K in Param | keyof ExtractPathParams<Rest>]: string;
      }
    : Path extends `${string}:${infer Param}`
      ? {
          [K in Param]: string;
        }
      : {};

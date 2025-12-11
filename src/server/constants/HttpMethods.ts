export const HttpMethods = {
  get: "get",
  post: "post",
  put: "put",
  delete: "delete",
  patch: "patch",
  head: "head",
  options: "options",
} as const;

export type HttpMethod = (typeof HttpMethods)[keyof typeof HttpMethods];

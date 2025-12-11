export const SuccessStatusCodes = {
    Ok_200: 200,
    Created_201: 201,
    NoContent_204: 204,
} as const;

export type SuccessStatusCode = typeof SuccessStatusCodes[keyof typeof SuccessStatusCodes];

export const ClientErrorStatusCodes = {
    BadRequest_400: 400,
    Unauthorized_401: 401,
    Forbidden_403: 403,
    NotFound_404: 404,
    Conflict_409: 409,
} as const;

export type ClientErrorStatusCode = typeof ClientErrorStatusCodes[keyof typeof ClientErrorStatusCodes];

export const ServerErrorStatusCodes = {
    InternalServerError_500: 500,
    NotImplemented_501: 501,
    BadGateway_502: 502,
    ServiceUnavailable_503: 503,
} as const;

export type ServerErrorStatusCode = typeof ServerErrorStatusCodes[keyof typeof ServerErrorStatusCodes];

export const HttpStatusCodes = {
    ...SuccessStatusCodes,
    ...ClientErrorStatusCodes,
    ...ServerErrorStatusCodes,
} as const;

export type HttpStatusCode = typeof HttpStatusCodes[keyof typeof HttpStatusCodes];
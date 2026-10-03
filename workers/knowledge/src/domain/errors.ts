export type ErrorCode =
  | "INVALID_INPUT"
  | "METHOD_NOT_ALLOWED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "BODY_TOO_LARGE"
  | "TURNSTILE_REQUIRED"
  | "TURNSTILE_FAILED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "DUPLICATE_REQUEST"
  | "DUPLICATE_SUBMISSION"
  | "SPAM_REJECTED"
  | "HONEYPOT_REJECTED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly safeMessage: string,
    readonly retryAfter?: number,
  ) {
    super(safeMessage);
  }
}

export const fail = (requestId: string, error: ApiError): Response =>
  Response.json(
    { ok: false, error: { code: error.code, message: error.safeMessage }, request_id: requestId },
    { status: error.status, headers: { "X-Request-Id": requestId, "Cache-Control": "no-store", ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) } },
  );

export const success = (requestId: string, data: unknown, status = 200, headers: HeadersInit = {}): Response =>
  Response.json(
    { ok: true, data, request_id: requestId },
    { status, headers: { "X-Request-Id": requestId, ...headers } },
  );

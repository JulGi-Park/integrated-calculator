import type { ErrorCode } from "./domain/errors";
import type { TurnstileCategory } from "./security/turnstile";

export const logRequest = (data: {
  environment: string;
  requestId: string;
  route: string;
  method: string;
  status: number;
  latencyMs: number;
  turnstile: TurnstileCategory;
  rateLimit: "pass" | "limited" | "not_applied";
  errorCode?: ErrorCode;
}): void => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: data.environment,
    request_id: data.requestId,
    route: data.route,
    method: data.method,
    status: data.status,
    latency_ms: data.latencyMs,
    turnstile: data.turnstile,
    rate_limit: data.rateLimit,
    error_code: data.errorCode ?? null,
  }));
};

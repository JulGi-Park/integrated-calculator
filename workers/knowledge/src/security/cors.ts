import { ApiError } from "../domain/errors";

const ALLOWED_HEADERS = "Content-Type, Idempotency-Key";

export const assertKnowledgeHost = (env: Env, url: URL): void => {
  if (url.hostname !== env.KNOWLEDGE_API_HOST) {
    throw new ApiError(404, "NOT_FOUND", "요청 경로를 찾을 수 없습니다.");
  }
};

export const validKnowledgeOrigin = (env: Env, origin: string | null): string | null => {
  if (origin === null) return null;
  const allowed = origin === env.KNOWLEDGE_PUBLIC_ORIGIN
    || (env.ENVIRONMENT === "preview" && /^https:\/\/[a-z0-9-]+\.integrated-calculator\.pages\.dev$/u.test(origin));
  if (!allowed) throw new ApiError(403, "FORBIDDEN", "허용되지 않은 Origin입니다.");
  return origin;
};

export const corsHeaders = (origin: string | null): HeadersInit => origin === null ? {} : {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
};

export const assertStateChangingOrigin = (env: Env, origin: string | null): string => {
  if (origin === null) throw new ApiError(403, "FORBIDDEN", "Origin 헤더가 필요합니다.");
  return validKnowledgeOrigin(env, origin) ?? "";
};

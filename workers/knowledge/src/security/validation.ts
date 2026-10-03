import { ApiError } from "../domain/errors";

const MAX_BODY_BYTES = 16 * 1024;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64_URL_16_BYTES = /^[A-Za-z0-9_-]{22}$/;
const BASE64_URL_32_BYTES = /^[A-Za-z0-9_-]{43}$/;
const RESERVED = new Set(["관리자", "운영자", "계산박스", "공식", "admin", "administrator", "staff", "moderator"]);
const URL_PATTERN = /(?:https?:\/\/|www\.)/iu;
// eslint-disable-next-line no-control-regex -- C0/C1 controls are intentionally rejected from user text.
const CONTROL_PATTERN = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/u;
const NICKNAME_PATTERN = /^[\p{Script=Hangul}\p{Script=Latin}\p{N}]+(?: [\p{Script=Hangul}\p{Script=Latin}\p{N}]+)*$/u;

export type CommentInput = { nickname: string; body: string; turnstile_token: string };
export type ReportInput = { reason: "spam" | "abuse" | "privacy" | "inaccurate" | "other"; turnstile_token: string };

const charCount = (value: string): number => Array.from(value).length;
const invalid = (message: string): never => { throw new ApiError(400, "INVALID_INPUT", message); };

export const assertUuid = (value: string): void => {
  if (!UUID_V4.test(value)) invalid("식별자 형식이 올바르지 않습니다.");
};

export const assertIdempotencyKey = (value: string | null): string => {
  if (!value || !UUID_V4.test(value)) invalid("Idempotency-Key 형식이 올바르지 않습니다.");
  return value!;
};

export const assertDeleteToken = (value: string | null): string => {
  if (!value || !BASE64_URL_32_BYTES.test(value)) invalid("삭제 토큰 형식이 올바르지 않습니다.");
  return value!;
};

export const assertShortToken = (value: string | null, label: string): string => {
  if (!value || !BASE64_URL_16_BYTES.test(value)) invalid(`${label} 형식이 올바르지 않습니다.`);
  return value!;
};

export const normalizeNickname = (raw: string): string => {
  const value = raw.normalize("NFC").trim();
  if (charCount(value) < 2 || charCount(value) > 20 || !NICKNAME_PATTERN.test(value)) invalid("닉네임 형식이 올바르지 않습니다.");
  const reservedKey = value.normalize("NFKC").toLocaleLowerCase("en-US").replaceAll(/\s/gu, "");
  if (RESERVED.has(reservedKey)) invalid("사용할 수 없는 닉네임입니다.");
  return value;
};

export const normalizeCommentBody = (raw: string): string => {
  const value = raw.normalize("NFC").trim();
  if (charCount(value) < 1 || charCount(value) > 1000 || CONTROL_PATTERN.test(value) || /[<>]/u.test(value) || URL_PATTERN.test(value.normalize("NFKC").toLocaleLowerCase("en-US"))) {
    invalid("댓글 내용 형식이 올바르지 않습니다.");
  }
  return value;
};

export const readJson = async (request: Request, maxBodyBytes = MAX_BODY_BYTES): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "application/json 요청만 허용됩니다.");
  const requestBody = request.body;
  if (!requestBody) invalid("요청 본문이 필요합니다.");
  const reader = requestBody!.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        throw new ApiError(413, "BODY_TOO_LARGE", "요청 본문이 너무 큽니다.");
      }
      chunks.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) invalid("JSON object가 필요합니다.");
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "INVALID_INPUT", "JSON 형식이 올바르지 않습니다.");
  }
};

const assertOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): void => {
  if (Object.keys(value).some((key) => !keys.includes(key))) invalid("허용되지 않은 필드가 있습니다.");
};

export const parseCommentInput = (value: Record<string, unknown>): CommentInput => {
  assertOnlyKeys(value, ["nickname", "body", "turnstile_token"]);
  if (typeof value.nickname !== "string" || typeof value.body !== "string" || typeof value.turnstile_token !== "string") invalid("필수 필드 형식이 올바르지 않습니다.");
  const { nickname, body, turnstile_token: turnstileToken } = value as { nickname: string; body: string; turnstile_token: string };
  if (turnstileToken.length === 0) throw new ApiError(400, "TURNSTILE_REQUIRED", "Turnstile 토큰이 필요합니다.");
  if (turnstileToken.length > 2048) throw new ApiError(400, "TURNSTILE_FAILED", "Turnstile 토큰이 올바르지 않습니다.");
  return { nickname: normalizeNickname(nickname), body: normalizeCommentBody(body), turnstile_token: turnstileToken };
};

export const parseReportInput = (value: Record<string, unknown>): ReportInput => {
  assertOnlyKeys(value, ["reason", "turnstile_token"]);
  if (typeof value.reason !== "string" || typeof value.turnstile_token !== "string") invalid("필수 필드 형식이 올바르지 않습니다.");
  const { reason, turnstile_token: turnstileToken } = value as { reason: string; turnstile_token: string };
  if (turnstileToken.length === 0) throw new ApiError(400, "TURNSTILE_REQUIRED", "Turnstile 토큰이 필요합니다.");
  if (turnstileToken.length > 2048) throw new ApiError(400, "TURNSTILE_FAILED", "Turnstile 토큰이 올바르지 않습니다.");
  if (!(["spam", "abuse", "privacy", "inaccurate", "other"] as const).includes(reason as ReportInput["reason"])) invalid("신고 사유가 올바르지 않습니다.");
  return { reason: reason as ReportInput["reason"], turnstile_token: turnstileToken };
};

export const parseLimit = (value: string | null, max: number, fallback: number): number => {
  if (value === null) return fallback;
  if (!/^[1-9]\d*$/u.test(value)) invalid("limit 값이 올바르지 않습니다.");
  const parsed = Number(value);
  if (parsed > max) invalid("limit 값이 너무 큽니다.");
  return parsed;
};

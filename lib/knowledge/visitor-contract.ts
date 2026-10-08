export const VISITOR_QUESTION_CREATE_FIELDS = [
  "title",
  "isAnonymous",
  "nickname",
  "password",
  "body",
  "serviceIds",
  "turnstile_token",
  "category",
  "website",
] as const;

export const VISITOR_QUESTION_BODY_MAX_LENGTH = 3000;
export const VISITOR_QUESTION_BODY_TOO_LONG_MESSAGE = "질문 내용은 3,000자 이하로 입력해 주세요.";
export const VISITOR_QUESTION_BODY_INVALID_CHARACTERS = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F<>]/u;

/**
 * Count and normalize the visitor question body exactly as the Worker stores it.
 * JavaScript code points are used (Array.from), matching the Worker contract.
 */
export function normalizeVisitorQuestionBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Textareas represent line endings as LF. Normalize direct API CRLF/CR input too.
  const normalized = value.normalize("NFC").replace(/\r\n?/gu, "\n").trim();
  if (!normalized || Array.from(normalized).length > VISITOR_QUESTION_BODY_MAX_LENGTH) return null;
  // Preserve paragraph line breaks, while rejecting other control characters and markup.
  if (VISITOR_QUESTION_BODY_INVALID_CHARACTERS.test(normalized)) return null;
  return normalized;
}

export function visitorQuestionBodyLength(value: string): number {
  const normalized = value.normalize("NFC").replace(/\r\n?/gu, "\n").trim();
  return Array.from(normalized).length;
}

export function visitorQuestionBodyError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "질문 내용을 입력해 주세요.";
  const normalized = value.normalize("NFC").replace(/\r\n?/gu, "\n").trim();
  if (Array.from(normalized).length > VISITOR_QUESTION_BODY_MAX_LENGTH) return VISITOR_QUESTION_BODY_TOO_LONG_MESSAGE;
  if (!normalizeVisitorQuestionBody(value)) return "질문 내용 형식이 올바르지 않습니다.";
  return null;
}

const COMMON_VISITOR_PASSWORDS = new Set([
  "123456",
  "12345678",
  "password",
  "qwerty",
  "abc123",
]);

/** Shared client/server validation for newly-created visitor questions only. */
export function visitorPasswordPolicyError(value: unknown): string | null {
  if (typeof value !== "string") return "질문 비밀번호를 확인해 주세요.";
  if (Array.from(value).length < 6) return "질문 비밀번호는 6자 이상이어야 합니다.";

  if (/^(.)\1+$/u.test(value) || COMMON_VISITOR_PASSWORDS.has(value.toLowerCase())) {
    return "너무 단순한 비밀번호입니다. 다른 비밀번호를 입력해 주세요.";
  }

  // Reject an ascending/descending run of six ASCII digits anywhere in the value.
  for (let start = 0; start < value.length; start += 1) {
    const first = value.charCodeAt(start);
    if (first < 48 || first > 57) continue;
    let direction = 0;
    let run = 1;
    for (let index = start + 1; index < value.length; index += 1) {
      const current = value.charCodeAt(index);
      if (current < 48 || current > 57) break;
      const delta = current - value.charCodeAt(index - 1);
      if ((delta === 1 || delta === -1) && (direction === 0 || delta === direction)) {
        direction = delta;
        run += 1;
        if (run >= 6) return "너무 단순한 비밀번호입니다. 다른 비밀번호를 입력해 주세요.";
      } else {
        direction = 0;
        run = 1;
      }
    }
  }

  return null;
}

export type VisitorQuestionCreatePayload = {
  title: string;
  isAnonymous: boolean;
  nickname: string | null;
  password: string;
  body: string;
  serviceIds: string[];
  turnstile_token: string;
  category?: string;
  website: string;
};

export function buildVisitorQuestionCreatePayload(form: {
  title: string;
  anonymous: boolean;
  nickname: string;
  password: string;
  body: string;
  serviceIds: string[];
  category?: string;
  website?: string;
}, token: string): VisitorQuestionCreatePayload {
  return {
    title: form.title,
    isAnonymous: form.anonymous,
    nickname: form.anonymous ? null : form.nickname,
    password: form.password,
    body: form.body,
    serviceIds: form.serviceIds,
    turnstile_token: token,
    ...(form.category ? { category: form.category } : {}),
    website: form.website ?? "",
  };
}

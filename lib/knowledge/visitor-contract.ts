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

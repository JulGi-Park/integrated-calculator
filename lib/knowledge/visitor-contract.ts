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

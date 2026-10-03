import { ApiError } from "../domain/errors";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const validTurnstileHostname = (env: Env, hostname: string): boolean => env.ENVIRONMENT === "production"
  ? hostname === "gyesanbox.kr" || hostname === "www.gyesanbox.kr"
  : /^[a-z0-9-]+\.integrated-calculator\.pages\.dev$/u.test(hostname);

export type TurnstileCategory = "pass" | "fail" | "unavailable" | "not_required";

export const verifyTurnstile = async (token: string, secret: string, env: Env): Promise<TurnstileCategory> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const body = new URLSearchParams({ secret, response: token, idempotency_key: crypto.randomUUID() });
    const response = await fetch(VERIFY_URL, { method: "POST", body, signal: controller.signal });
    if (!response.ok) throw new Error("siteverify unavailable");
    const result = await response.json() as { success?: boolean; hostname?: string };
    if (!result.success || !result.hostname || !validTurnstileHostname(env, result.hostname)) {
      throw new ApiError(400, "TURNSTILE_FAILED", "Turnstile 검증에 실패했습니다.");
    }
    return "pass";
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "질문 검증 서비스를 일시적으로 사용할 수 없습니다.");
  } finally {
    clearTimeout(timer);
  }
};

import { ApiError, fail } from "./domain/errors";
import { logRequest } from "./observability";
import { assertKnowledgeHost, assertStateChangingOrigin, corsHeaders, validKnowledgeOrigin } from "./security/cors";
import { route } from "./router";
import type { TurnstileCategory } from "./security/turnstile";
import { WorkerEntrypoint } from "cloudflare:workers";
import { isKnowledgeVisitorRequest } from "../../../lib/knowledge/public-api";
export { KnowledgeImportEntrypoint } from "./knowledge-import-entrypoint";

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const admin = url.pathname === "/admin/knowledge" || url.pathname === "/admin/knowledge/"
      || url.pathname.startsWith("/api/knowledge/v1/admin/");
    let response: Response | undefined;
    let turnstile: TurnstileCategory = "not_required";
    let rateLimit: "pass" | "limited" | "not_applied" = "not_applied";
    let errorCode: ApiError["code"] | undefined;
    try {
      assertKnowledgeHost(env, url);
      const allowedOrigin = admin ? null : validKnowledgeOrigin(env, origin);
      if (admin && origin !== null && origin !== url.origin) throw new ApiError(403, "FORBIDDEN", "허용되지 않은 Origin입니다.");
      if (request.method === "OPTIONS") {
        if (!allowedOrigin) throw new ApiError(403, "FORBIDDEN", "Origin 헤더가 필요합니다.");
        response = new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
      } else {
        if (!admin && ["POST", "PATCH", "DELETE"].includes(request.method)) assertStateChangingOrigin(env, origin);
        const routed = await route(request, env, ctx, requestId);
        turnstile = routed.meta.turnstile;
        rateLimit = routed.meta.rateLimit;
        response = routed.response;
      }
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders(allowedOrigin))) headers.set(key, value);
      headers.set("Cache-Control", "no-store");
      response = new Response(response.body, { status: response.status, headers });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(500, "INTERNAL_ERROR", "일시적인 오류가 발생했습니다.");
      errorCode = apiError.code;
      if (apiError.code === "RATE_LIMITED") rateLimit = "limited";
      if (apiError.code === "TURNSTILE_FAILED") turnstile = "fail";
      response = fail(requestId, apiError);
      try {
        const allowedOrigin = admin ? null : validKnowledgeOrigin(env, origin);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(corsHeaders(allowedOrigin))) headers.set(key, value);
        response = new Response(response.body, { status: response.status, headers });
      } catch { /* Invalid origins never receive CORS headers. */ }
    } finally {
      logRequest({ environment: env.ENVIRONMENT, requestId, route: url.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/giu, ":id"), method: request.method, status: response?.status ?? 500, latencyMs: Date.now() - started, turnstile, rateLimit, errorCode });
    }
    return response ?? fail(requestId, new ApiError(500, "INTERNAL_ERROR", "일시적인 오류가 발생했습니다."));
  },
} satisfies ExportedHandler<Env>;

/** Public-only binding capability; the import entrypoint stays separate. */
export class KnowledgePublicEntrypoint extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (!isKnowledgeVisitorRequest(url.pathname, request.method)) {
      return fail(crypto.randomUUID(), new ApiError(404, "NOT_FOUND", "존재하지 않는 경로입니다."));
    }
    // Internal dispatch reuses all existing Origin/password/Turnstile/rate-limit checks.
    url.hostname = this.env.KNOWLEDGE_API_HOST;
    url.protocol = "https:";
    url.port = "";
    return worker.fetch(new Request(url, request), this.env, this.ctx);
  }
}

export default worker;

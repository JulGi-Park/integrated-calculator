import { ApiError, success } from "./domain/errors";
import { requireAdmin } from "./security/admin";
import { readJson } from "./security/validation";
import { importBatch, importResult, importStatus } from "./domain/knowledge-import";
import { adminUi } from "./admin-ui";
import {
  createAdminKnowledgeAnswer, createAdminKnowledgeQuestion, createKnowledgeQuestion,
  deleteAdminKnowledgeQuestion, getKnowledgeQuestion, getPublicKnowledgeQuestion,
  hideAdminKnowledgeQuestion, listKnowledgeQuestions, listPublicKnowledgeQuestions,
  listPublicKnowledgeServices, patchAdminKnowledgeAnswer, patchAdminKnowledgeQuestion,
  patchKnowledgeQuestion, deleteKnowledgeQuestion, publishAdminKnowledgeQuestion, verifyKnowledgeQuestionPassword,
} from "./api/knowledge";

type Result = { response: Response; meta: { turnstile: "pass" | "fail" | "unavailable" | "not_required"; rateLimit: "pass" | "limited" | "not_applied" } };
const plain = (response: Response): Result => ({ response, meta: { turnstile: "not_required", rateLimit: "not_applied" } });
const missing = (): never => { throw new ApiError(404, "NOT_FOUND", "요청 경로를 찾을 수 없습니다."); };

export async function route(request: Request, env: Env, ctx: ExecutionContext, requestId: string): Promise<Result> {
  const { pathname } = new URL(request.url);
  const method = request.method;
  if (pathname === "/admin/knowledge" || pathname === "/admin/knowledge/") {
    if (method !== "GET") return missing();
    await requireAdmin(env, ctx);
    return plain(adminUi());
  }
  if (pathname.startsWith("/api/knowledge/v1/admin/")) {
    const actor = await requireAdmin(env, ctx);
    if (pathname === "/api/knowledge/v1/admin/import/status" && method === "GET") {
      return plain(success(requestId, await importStatus(env), 200, { "Cache-Control": "no-store" }));
    }
    if (pathname === "/api/knowledge/v1/admin/import/result" && method === "POST") {
      return plain(success(requestId, await importResult(env, await readJson(request)), 200, { "Cache-Control": "no-store" }));
    }
    if (pathname === "/api/knowledge/v1/admin/import/validate" && method === "POST") {
      return plain(success(requestId, await importBatch(env, actor, await readJson(request, 512 * 1024), false), 200, { "Cache-Control": "no-store" }));
    }
    if (pathname === "/api/knowledge/v1/admin/import" && method === "POST") {
      return plain(success(requestId, await importBatch(env, actor, await readJson(request, 512 * 1024), true), 200, { "Cache-Control": "no-store" }));
    }
    const base = "/api/knowledge/v1/admin/questions";
    if (pathname === base && method === "GET") return listKnowledgeQuestions(request, env, requestId);
    if (pathname === base && method === "POST") return createAdminKnowledgeQuestion(request, env, requestId, actor);
    const detail = pathname.match(/^\/api\/knowledge\/v1\/admin\/questions\/([0-9a-f-]+)$/iu);
    const answer = pathname.match(/^\/api\/knowledge\/v1\/admin\/questions\/([0-9a-f-]+)\/answer$/iu);
    const transition = pathname.match(/^\/api\/knowledge\/v1\/admin\/questions\/([0-9a-f-]+)\/(publish|hide)$/iu);
    if (detail && method === "GET") return getKnowledgeQuestion(env, requestId, detail[1]);
    if (detail && method === "PATCH") return patchAdminKnowledgeQuestion(request, env, requestId, actor, detail[1]);
    if (detail && method === "DELETE") return deleteAdminKnowledgeQuestion(request, env, requestId, actor, detail[1]);
    if (answer && method === "POST") return createAdminKnowledgeAnswer(request, env, requestId, actor, answer[1]);
    if (answer && method === "PATCH") return patchAdminKnowledgeAnswer(request, env, requestId, actor, answer[1]);
    if (transition && method === "POST") return transition[2] === "hide"
      ? hideAdminKnowledgeQuestion(request, env, requestId, actor, transition[1])
      : publishAdminKnowledgeQuestion(request, env, requestId, actor, transition[1]);
    if (detail || answer || transition || pathname === base) {
      throw new ApiError(405, "METHOD_NOT_ALLOWED", "허용되지 않은 요청 방식입니다.");
    }
    return missing();
  }
  const base = "/api/knowledge/v1/questions";
  if (pathname === base && method === "GET") return listPublicKnowledgeQuestions(request, env, requestId);
  if (pathname === base && method === "POST") return createKnowledgeQuestion(request, env, requestId);
  if (pathname === "/api/knowledge/v1/services" && method === "GET") return listPublicKnowledgeServices(env, requestId);
  const detail = pathname.match(/^\/api\/knowledge\/v1\/questions\/([0-9a-f-]+)$/iu);
  const passwordCheck = pathname.match(/^\/api\/knowledge\/v1\/questions\/([0-9a-f-]+)\/verify-password$/iu);
  if (passwordCheck && method === "POST") return verifyKnowledgeQuestionPassword(request, env, requestId, passwordCheck[1]);
  if (detail && method === "GET") return getPublicKnowledgeQuestion(env, requestId, detail[1]);
  if (detail && method === "PATCH") return patchKnowledgeQuestion(request, env, requestId, detail[1]);
  if (detail && method === "DELETE") return deleteKnowledgeQuestion(request, env, requestId, detail[1]);
  return missing();
}

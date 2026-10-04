import { WorkerEntrypoint } from "cloudflare:workers";
import { ApiError } from "./domain/errors";
import { assertImportEnabled, importBatch, importResult, importStatus, publishVerifiedImports } from "./domain/knowledge-import";
import { hmacHash } from "./security/tokens";

// An account-managed, named Service Binding capability. No public HTTP route,
// arbitrary target URL, publish, edit, visitor write, or general admin operations.
export class KnowledgeImportEntrypoint extends WorkerEntrypoint<Env> {
  async call(tool: string, input: unknown) {
    try {
      assertImportEnabled(this.env);
      const actor = { hash: await hmacHash(this.env.AUTHOR_TOKEN_PEPPER, "admin", "gyesanbox-knowledge-gpt-preview") };
      let data: unknown;
      if (tool === "knowledge_preview_status") data = await importStatus(this.env);
      else if (tool === "knowledge_validate_import") data = await importBatch(this.env, actor, input, false);
      else if (tool === "knowledge_import_drafts") data = await importBatch(this.env, actor, input, true);
      else if (tool === "knowledge_import_result") data = await importResult(this.env, input);
      else if (tool === "knowledge_publish_verified_imports") data = await publishVerifiedImports(this.env, actor, input);
      else throw new ApiError(403, "FORBIDDEN", "허용되지 않은 도구입니다.");
      return { ok: true as const, data };
    } catch (error) {
      console.error("knowledge_import_rpc_failure", {
        tool,
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message.slice(0, 160) : "unknown",
      });
      return { ok: false as const, error: { code: error instanceof ApiError ? error.code : "INTERNAL_ERROR", status: error instanceof ApiError ? error.status : 500 } };
    }
  }
}

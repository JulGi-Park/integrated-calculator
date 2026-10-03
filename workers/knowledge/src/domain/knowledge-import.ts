import { ApiError } from "./errors";
import { answerStatement, assertServices, audit, hashPassword, seedStatements, text, knowledgeCategory } from "./knowledge";
import type { KnowledgeCategory } from "../../../../lib/knowledge/categories";
import type { AdminActor } from "../security/admin";
import { sha256 } from "../security/tokens";

export const MAX_IMPORT_BATCH = 20;
type Item = { sourceKey: string; title: string; questionBody: string; answerBody: string; serviceSlugs: string[]; category: KnowledgeCategory };
type Ledger = { source_key: string; payload_hash: string; batch_id: string; question_id: string; answer_id: string; service_slugs: string; created_at: string; category: KnowledgeCategory | null };
type Outcome = { sourceKey: string | null; status: string; questionId?: string; answerId?: string; serviceSlugs?: string[]; category?: KnowledgeCategory | null; errorCode?: string };
const object = (value: unknown): Record<string, unknown> => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "INVALID_INPUT", "JSON object가 필요합니다."); return value as Record<string, unknown>; };
const keys = (value: Record<string, unknown>, allowed: string[]) => { if (Object.keys(value).some(k => !allowed.includes(k))) throw new ApiError(400, "INVALID_INPUT", "허용되지 않은 필드가 있습니다."); };
const importKey = (value: unknown): string => { if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/u.test(value)) throw new ApiError(400, "INVALID_INPUT", "import 키 형식이 올바르지 않습니다."); return value; };
const parseItem = (value: unknown): Item => {
  const raw = object(value); keys(raw, ["sourceKey", "title", "questionBody", "answerBody", "serviceSlugs", "category"]);
  if (!Array.isArray(raw.serviceSlugs) || raw.serviceSlugs.length > 21 || raw.serviceSlugs.some(s => typeof s !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(s))) throw new ApiError(400, "INVALID_INPUT", "관련 계산기 slug 형식이 올바르지 않습니다.");
  return { sourceKey: importKey(raw.sourceKey), title: text(raw.title, "질문 제목", 1, 120), questionBody: text(raw.questionBody, "질문 내용", 1, 4000), answerBody: text(raw.answerBody, "공식답변", 1, 4000), serviceSlugs: [...new Set(raw.serviceSlugs as string[])].sort(), category: knowledgeCategory(raw.category) };
};
const parseBatch = (value: unknown) => {
  const raw = object(value); keys(raw, ["batchId", "items"]);
  const batchId = importKey(raw.batchId);
  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > MAX_IMPORT_BATCH) throw new ApiError(400, "INVALID_INPUT", "한 요청에 1~20건만 가져올 수 있습니다.");
  if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > 512 * 1024) throw new ApiError(413, "BODY_TOO_LARGE", "요청 본문이 너무 큽니다.");
  const seen = new Set<unknown>();
  for (const item of raw.items) { const key = object(item).sourceKey; if (seen.has(key)) throw new ApiError(400, "DUPLICATE_REQUEST", "batch 안에서 sourceKey가 중복되었습니다."); seen.add(key); }
  return { batchId, items: raw.items };
};
const ledger = (db: D1Database, key: string) => db.prepare("SELECT i.*,q.category FROM knowledge_imports i JOIN knowledge_questions q ON q.id=i.question_id WHERE i.source_key=?1").bind(key).first<Ledger>();
const replay = (row: Ledger): Outcome => ({ sourceKey: row.source_key, status: "existing", questionId: row.question_id, answerId: row.answer_id, serviceSlugs: JSON.parse(row.service_slugs) as string[], category: row.category });
const resolveServices = async (db: D1Database, slugs: string[]) => {
  if (!slugs.length) return [];
  const rows = (await db.prepare(`SELECT id,slug FROM services WHERE status='active' AND slug IN (${slugs.map(() => "?").join(",")})`).bind(...slugs).all<{ id: string; slug: string }>()).results;
  if (rows.length !== slugs.length) return null;
  const ids = rows.map(r => r.id); await assertServices(db, ids); return ids;
};
export const assertImportPreview = (env: Env) => { if (env.ENVIRONMENT !== "preview" || env.KNOWLEDGE_ADMIN_ENABLED !== "true") throw new ApiError(403, "FORBIDDEN", "Preview 가져오기만 허용됩니다."); };

export const importBatch = async (env: Env, actor: AdminActor, value: unknown, write: boolean) => {
  assertImportPreview(env);
  const batch = parseBatch(value), outcomes: Outcome[] = [];
  for (const raw of batch.items) {
    let sourceKey: string | null = null;
    try {
      const item = parseItem(raw); sourceKey = item.sourceKey;
      const hash = await sha256(JSON.stringify(item));
      const existing = await ledger(env.KNOWLEDGE_DB, sourceKey);
      // Legacy hashes stay untouched. Adding category must not silently replay or backfill them.
      if (existing) { outcomes.push(existing.payload_hash === hash && existing.category === item.category ? replay(existing) : { sourceKey, status: "failed", errorCode: "SOURCE_KEY_CONFLICT" }); continue; }
      const serviceIds = await resolveServices(env.KNOWLEDGE_DB, item.serviceSlugs);
      if (serviceIds === null) { outcomes.push({ sourceKey, status: "failed", errorCode: "UNKNOWN_SERVICE" }); continue; }
      if (!write) { outcomes.push({ sourceKey, status: "valid", serviceSlugs: item.serviceSlugs, category: item.category }); continue; }
      const id = crypto.randomUUID(), answerId = crypto.randomUUID(), at = new Date().toISOString();
      // Password exists only transiently on the server; never returned, persisted raw, or logged.
      const passwordHash = await hashPassword(crypto.randomUUID() + crypto.randomUUID());
      try {
        await env.KNOWLEDGE_DB.batch([
          ...seedStatements(env.KNOWLEDGE_DB, actor, { title: item.title, body: item.questionBody, serviceIds, category: item.category }, id, passwordHash, at, "draft"),
          answerStatement(env.KNOWLEDGE_DB, answerId, id, item.answerBody, at),
          audit(env.KNOWLEDGE_DB, actor, "knowledge_answer_created", id, at),
          env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_imports (source_key,payload_hash,batch_id,question_id,answer_id,service_slugs,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)").bind(sourceKey, hash, batch.batchId, id, answerId, JSON.stringify(item.serviceSlugs), at),
        ]);
      } catch {
        // A racing retry loses the UNIQUE constraint; D1 batch rolls back all of its writes.
        const raced = await ledger(env.KNOWLEDGE_DB, sourceKey);
        if (raced) { outcomes.push(raced.payload_hash === hash && raced.category === item.category ? replay(raced) : { sourceKey, status: "failed", errorCode: "SOURCE_KEY_CONFLICT" }); continue; }
        throw new ApiError(503, "SERVICE_UNAVAILABLE", "초안 가져오기를 완료하지 못했습니다.");
      }
      outcomes.push({ sourceKey, status: "inserted", questionId: id, answerId, serviceSlugs: item.serviceSlugs, category: item.category });
    } catch (error) {
      outcomes.push({ sourceKey, status: "failed", errorCode: error instanceof ApiError ? error.code : "INTERNAL_ERROR" });
    }
  }
  return { batchId: batch.batchId, attempted: outcomes.length, inserted: outcomes.filter(x => x.status === "inserted").length, existing: outcomes.filter(x => x.status === "existing").length, valid: outcomes.filter(x => x.status === "valid").length, failed: outcomes.filter(x => x.status === "failed").length, items: outcomes };
};
export const importStatus = async (env: Env) => {
  assertImportPreview(env);
  const counts = await env.KNOWLEDGE_DB.prepare("SELECT (SELECT COUNT(*) FROM knowledge_questions) questions,(SELECT COUNT(*) FROM knowledge_answers) answers,(SELECT COUNT(*) FROM knowledge_question_services) serviceLinks").first<{ questions: number; answers: number; serviceLinks: number }>();
  const services = (await env.KNOWLEDGE_DB.prepare("SELECT slug,name FROM services WHERE status='active' ORDER BY slug").all()).results;
  return { environment: "preview", maxBatch: MAX_IMPORT_BATCH, ...counts, services };
};
export const importResult = async (env: Env, value: unknown) => {
  assertImportPreview(env);
  const raw = object(value); keys(raw, ["batchId", "sourceKey"]);
  if (raw.sourceKey === undefined && raw.batchId === undefined) throw new ApiError(400, "INVALID_INPUT", "batchId 또는 sourceKey가 필요합니다.");
  const conditions: string[] = [], values: string[] = [];
  if (raw.sourceKey !== undefined) { conditions.push("i.source_key=?"); values.push(importKey(raw.sourceKey)); }
  if (raw.batchId !== undefined) { conditions.push("i.batch_id=?"); values.push(importKey(raw.batchId)); }
  const rows = (await env.KNOWLEDGE_DB.prepare(`SELECT i.*,q.category FROM knowledge_imports i JOIN knowledge_questions q ON q.id=i.question_id WHERE ${conditions.join(" AND ")} ORDER BY i.source_key LIMIT 100`).bind(...values).all<Ledger>()).results;
  return { items: rows.map(row => ({ ...replay(row), batchId: row.batch_id, importedAt: row.created_at })) };
};

// The initial approved Preview set can be published only as a complete, intact
// import. This capability is exposed solely through a named Worker service binding.
export const publishVerifiedImports = async (env: Env, actor: AdminActor, value: unknown) => {
  assertImportPreview(env);
  const raw = object(value); keys(raw, ["sourceKeys", "sourceSha256"]);
  if (raw.sourceSha256 !== "6c3d6aca606d4f0eb63377765ff9e2ce8e937c4c60d7701bc27e9dbcd9d7dd7f") {
    throw new ApiError(409, "INVALID_STATE", "승인 정본 해시가 일치하지 않습니다.");
  }
  if (!Array.isArray(raw.sourceKeys) || raw.sourceKeys.length !== 200) {
    throw new ApiError(400, "INVALID_INPUT", "승인된 200개 sourceKey가 필요합니다.");
  }
  const sourceKeys = raw.sourceKeys.map(importKey);
  if (new Set(sourceKeys).size !== 200) throw new ApiError(400, "DUPLICATE_REQUEST", "sourceKey가 중복되었습니다.");
  const chunks = Array.from({ length: 4 }, (_, index) => sourceKeys.slice(index * 50, index * 50 + 50));
  const rows: Array<{ id: string; status: string }> = [];
  for (const chunk of chunks) {
    const placeholders = chunk.map(() => "?").join(",");
    const sql = `SELECT q.id,q.status FROM knowledge_imports i JOIN knowledge_questions q ON q.id=i.question_id WHERE i.source_key IN (${placeholders})`;
    rows.push(...(await env.KNOWLEDGE_DB.prepare(sql).bind(...chunk).all<{ id: string; status: string }>()).results);
  }
  const integrity = await env.KNOWLEDGE_DB.prepare(`SELECT
    (SELECT COUNT(*) FROM knowledge_questions) questions,
    (SELECT COUNT(*) FROM knowledge_answers) answers,
    (SELECT COUNT(*) FROM knowledge_imports) imports,
    (SELECT COUNT(*) FROM knowledge_question_services) links,
    (SELECT COUNT(*) FROM services WHERE status='active') services,
    (SELECT COUNT(*) FROM knowledge_answers a LEFT JOIN knowledge_questions q ON q.id=a.question_id WHERE q.id IS NULL) dangling_answers,
    (SELECT COUNT(*) FROM knowledge_question_services s LEFT JOIN knowledge_questions q ON q.id=s.question_id LEFT JOIN services c ON c.id=s.service_id WHERE q.id IS NULL OR c.id IS NULL) dangling_links`).first<Record<string, number>>();
  if (!integrity || integrity.questions !== 200 || integrity.answers !== 200 || integrity.imports !== 200
    || integrity.links !== 109 || integrity.services !== 21 || integrity.dangling_answers !== 0
    || integrity.dangling_links !== 0 || rows.length !== 200 || rows.some((row) => !["draft", "published"].includes(row.status))) {
    throw new ApiError(409, "INVALID_STATE", "승인 데이터 무결성이 일치하지 않습니다.");
  }
  for (const chunk of chunks) {
    const placeholders = chunk.map(() => "?").join(",");
    const current = (await env.KNOWLEDGE_DB.prepare(`SELECT q.id,q.status FROM knowledge_imports i JOIN knowledge_questions q ON q.id=i.question_id WHERE i.source_key IN (${placeholders})`).bind(...chunk).all<{ id: string; status: string }>()).results;
    const pending = current.filter((row) => row.status === "draft");
    if (!pending.length) continue;
    const at = new Date().toISOString();
    await env.KNOWLEDGE_DB.batch([
      env.KNOWLEDGE_DB.prepare(`UPDATE knowledge_questions SET status='published',updated_at=?1 WHERE status='draft' AND id IN (${pending.map(() => "?").join(",")})`).bind(at, ...pending.map((row) => row.id)),
      ...pending.map((row) => audit(env.KNOWLEDGE_DB, actor, "knowledge_question_published", row.id, at)),
    ]);
  }
  const published = await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) AS count FROM knowledge_questions WHERE status='published'").first<{ count: number }>();
  if (published?.count !== 200) throw new ApiError(503, "SERVICE_UNAVAILABLE", "승인 데이터 공개 결과를 확인할 수 없습니다.");
  return { published: 200, sourceSha256: raw.sourceSha256 };
};

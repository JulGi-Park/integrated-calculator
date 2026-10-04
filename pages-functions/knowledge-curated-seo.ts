// Pages Functions only. Never import from app/components or public API modules.
import approvedManifest from "./data/knowledge-seo-enhancement-261004.json";
import { normalizeKnowledgeQuestionId } from "../lib/knowledge/seo";
import type { PublicQuestion, PublicListQuestion } from "./knowledge-seo";

export type IdentityDatabase = {
  prepare(sql: string): { bind(...values: string[]): { all<T>(): Promise<{ success: boolean; results: T[] }> } };
};
type Fingerprint = { title: string; question_body: string; answer_body: string; category: string; content: string };
export type CuratedRecord = {
  sourceKey: string; title: string; seoTitle: string; description: string;
  review: boolean; fingerprint: Fingerprint;
  related: Array<{ sourceKey: string; title: string }>;
};
export type CuratedManifest = ReadonlyMap<string, CuratedRecord>;
export type CuratedResult = {
  metadata?: { title: string; description: string };
  related: PublicListQuestion[];
  reason: "curated" | "review" | "stale" | "unresolved" | "unmapped" | "disabled";
};

/** Editorial indices are converted once; request identity uses only sourceKey. */
export function parseCuratedManifest(value: unknown): CuratedManifest | null {
  try {
    const manifest = value as typeof approvedManifest;
    if (manifest.version !== "knowledge-seo-enhancement-v1" || manifest.records.length !== 200) return null;
    const indices = new Map(manifest.records.map(r => [r.source_index, r]));
    if (indices.size !== manifest.records.length) return null;
    const records = new Map<string, CuratedRecord>();
    for (const r of manifest.records) {
      if (!r.sourceKey || records.has(r.sourceKey) || !r.current_title || !r.category
        || !r.proposed_seo_title.endsWith(" | 계산박스") || !r.proposed_meta_description
        || !["FINGERPRINT_MATCH_ONLY", "REVIEW_BEFORE_APPLY"].includes(r.enrichment_apply_policy)
        || ![r.source_fingerprint.title, r.source_fingerprint.question_body, r.source_fingerprint.answer_body,
          r.source_fingerprint.category, r.source_fingerprint.content].every(hash => /^[0-9a-f]{64}$/u.test(hash))) return null;
      const related = r.related_question_evidence.map(edge => {
        const target = indices.get(edge.source_index);
        if (!target || target.sourceKey === r.sourceKey || edge.anchor !== target.current_title) throw new Error("INVALID_EDGE");
        return { sourceKey: target.sourceKey, title: edge.anchor };
      });
      if (new Set(related.map(edge => edge.sourceKey)).size !== related.length || related.length > 5
        || JSON.stringify(r.related_question_source_indices) !== JSON.stringify(r.related_question_evidence.map(e => e.source_index))) return null;
      records.set(r.sourceKey, { sourceKey: r.sourceKey, title: r.current_title,
        seoTitle: r.proposed_seo_title, description: r.proposed_meta_description,
        review: r.enrichment_apply_policy === "REVIEW_BEFORE_APPLY" || r.seo_quality_flag.includes("ANSWER_SCOPE_REVIEW"),
        fingerprint: r.source_fingerprint, related });
    }
    return records;
  } catch { return null; }
}

const manifest = parseCuratedManifest(approvedManifest);
const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))
  .map(byte => byte.toString(16).padStart(2, "0")).join("");

export async function fingerprintMatches(record: CuratedRecord, question: PublicQuestion): Promise<boolean> {
  if (question.status !== "published" || !question.answer || question.category === null) return false;
  const { title, body, category } = question;
  const answer = question.answer.body;
  const actual = await Promise.all([title, body, answer, category, JSON.stringify({ title, body, answer, category })].map(sha256));
  const expected = record.fingerprint;
  return actual.every((hash, i) => hash === [expected.title, expected.question_body, expected.answer_body, expected.category, expected.content][i]);
}

// SELECT-only capability. Passwords/hashes/audit data are never selected.
export async function resolveImportIdentities(db: IdentityDatabase, keys: string[]): Promise<Map<string, string>> {
  const identities = new Map<string, string>();
  const ids = new Set<string>();
  // D1 allows at most 100 bound parameters per query.
  for (let offset = 0; offset < keys.length; offset += 80) {
    const batch = keys.slice(offset, offset + 80);
    const placeholders = batch.map(() => "?").join(",");
    const result = await db.prepare(`SELECT i.source_key, i.question_id FROM knowledge_imports i JOIN knowledge_questions q ON q.id=i.question_id WHERE q.status='published' AND i.source_key IN (${placeholders})`)
      .bind(...batch).all<{ source_key: string; question_id: string }>();
    if (!result.success) throw new Error("IDENTITY_UNAVAILABLE");
    for (const row of result.results) {
      const id = normalizeKnowledgeQuestionId(row.question_id);
      if (!batch.includes(row.source_key) || identities.has(row.source_key) || ids.has(id)) throw new Error("IDENTITY_INVALID");
      identities.set(row.source_key, id); ids.add(id);
    }
  }
  return identities;
}

export async function curatedKnowledgeSeo(options: {
  environment: "preview" | "production";
  curatedEnabled?: boolean;
  db?: IdentityDatabase;
  question: PublicQuestion;
  readPublished: (id: string) => Promise<PublicQuestion | null>;
  records?: CuratedManifest | null;
}): Promise<CuratedResult> {
  const fallback = (reason: CuratedResult["reason"]): CuratedResult => ({ reason, related: [] });
  if (options.curatedEnabled !== true) return fallback("disabled");
  const records = options.records === undefined ? manifest : options.records;
  if (!records || !options.db) return fallback("unresolved");
  try {
    const identities = await resolveImportIdentities(options.db, [...records.keys()]);
    const entry = [...identities].find(([, id]) => id === options.question.id);
    if (!entry) return fallback("unmapped");
    const record = records.get(entry[0]);
    if (!record) return fallback("unmapped");
    if (!await fingerprintMatches(record, options.question)) return fallback("stale");
    const related: PublicListQuestion[] = [];
    const seen = new Set([options.question.id]);
    for (const edge of record.related) {
      const id = identities.get(edge.sourceKey);
      if (!id || seen.has(id) || related.length >= 5) continue;
      try {
        const target = await options.readPublished(id);
        if (!target || target.id !== id || target.status !== "published" || target.title !== edge.title) continue;
        seen.add(id);
        related.push({ id, title: target.title, category: target.category });
      } catch { /* Unavailable targets never cause filler or break the current page. */ }
    }
    return { reason: record.review ? "review" : "curated", related,
      ...(record.review ? {} : { metadata: { title: record.seoTitle, description: record.description } }) };
  } catch { return fallback("unresolved"); }
}

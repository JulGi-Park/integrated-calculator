// Development verification only. No import API calls or database writes.
import { createHash } from "node:crypto";
import { knowledgeSeo } from "../../lib/knowledge/seo.ts";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalizedText = (value) => value.normalize("NFC").trim();
const sorted = (values) => [...new Set(values)].sort();

export function buildSeoMapping(source, rows, sourceSha256) {
  const imports = new Map();
  for (const row of rows) {
    if (imports.has(row.source_key)) throw new Error(`DUPLICATE_SOURCE_KEY:${row.source_key}`);
    imports.set(row.source_key, row);
  }
  const keys = new Set();
  const ids = new Set();
  const paths = new Set();
  return source.map((record) => {
    if (!Number.isSafeInteger(record.source_index) || record.source_index < 1) {
      throw new Error("INVALID_SOURCE_INDEX");
    }
    const sourceKey = `kin-261001-${String(record.source_index).padStart(3, "0")}`;
    if (keys.has(sourceKey)) throw new Error(`DUPLICATE_SOURCE_KEY:${sourceKey}`);
    keys.add(sourceKey);
    const row = imports.get(sourceKey);
    if (!row) throw new Error(`MISSING_IMPORT:${sourceKey}`);
    const seo = knowledgeSeo({ id: row.question_id, title: row.title, body: row.body });
    if (ids.has(seo.normalizedQuestionId)) throw new Error(`DUPLICATE_QUESTION_ID:${sourceKey}`);
    if (paths.has(seo.detailPath)) throw new Error(`DUPLICATE_DETAIL_PATH:${sourceKey}`);
    ids.add(seo.normalizedQuestionId);
    paths.add(seo.detailPath);
    const sourceServices = record.related_calculator_slug ? [record.related_calculator_slug] : [];
    if (normalizedText(record.title) !== row.title
      || normalizedText(record.question_body) !== row.body
      || normalizedText(record.answer_body) !== row.answer_body
      || record.category !== row.category
      || row.status !== "published"
      || JSON.stringify(sorted(sourceServices)) !== JSON.stringify(sorted(JSON.parse(row.service_slugs)))) {
      throw new Error(`CONTENT_OR_RELATION_MISMATCH:${sourceKey}`);
    }
    return {
      source_index: record.source_index, sourceKey, question_id: row.question_id,
      title: row.title, normalizedQuestionId: seo.normalizedQuestionId,
      future_detail_path: seo.detailPath, canonical: seo.canonical,
      seo_title: seo.title, seo_description: seo.description, status: row.status,
      source_sha256: sourceSha256, contract_version: seo.contractVersion,
      content_fingerprint: sha256(JSON.stringify(row)),
    };
  });
}

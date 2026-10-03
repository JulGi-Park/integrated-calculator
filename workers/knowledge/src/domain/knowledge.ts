import { ApiError } from "./errors";
import type { AdminActor } from "../security/admin";
import { timingSafeEqual } from "../security/tokens";
import { isKnowledgeCategory, type KnowledgeCategory } from "../../../../lib/knowledge/categories";

export const knowledgeCategory = (value: unknown): KnowledgeCategory => {
  if (!isKnowledgeCategory(value)) throw new ApiError(400, "INVALID_INPUT", "지식센터 카테고리를 선택해 주세요.");
  return value;
};

// Shared by visitor/admin APIs and the import service; no parallel validators.
// eslint-disable-next-line no-control-regex -- preserve existing knowledge content contract.
export const text = (value: unknown, label: string, min: number, max: number): string => { if (typeof value !== "string") throw new ApiError(400, "INVALID_INPUT", `${label} 형식이 올바르지 않습니다.`); const v = value.normalize("NFC").trim(); if (Array.from(v).length < min || Array.from(v).length > max || /[\u0000-\u001F\u007F-\u009F<>]/u.test(v)) throw new ApiError(400, "INVALID_INPUT", `${label} 형식이 올바르지 않습니다.`); return v; };
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
const unb64 = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4)), c => c.charCodeAt(0));
export const hashPassword = async (password: string): Promise<string> => { const salt = crypto.getRandomValues(new Uint8Array(16)); const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256); return `v1$pbkdf2-sha256$100000$${b64(salt)}$${b64(new Uint8Array(bits))}`; };
export const verifyPassword = async (password: string, encoded: string): Promise<boolean> => { const parts = encoded.split("$"); if (parts.length !== 5 || parts[0] !== "v1" || parts[1] !== "pbkdf2-sha256") return false; const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unb64(parts[3]), iterations: Number(parts[2]), hash: "SHA-256" }, key, 256); return timingSafeEqual(b64(new Uint8Array(bits)), parts[4]); };
export const assertServices = async (db: D1Database, ids: string[]) => { if (!ids.length) return; const rows = (await db.prepare(`SELECT id FROM services WHERE status='active' AND id IN (${ids.map((_, i) => `?${i + 1}`).join(",")})`).bind(...ids).all()).results; if (rows.length !== ids.length) throw new ApiError(400, "INVALID_INPUT", "관련 계산기를 확인해 주세요."); };
export const audit = (db: D1Database, actor: AdminActor, action: string, id: string, at: string) => db.prepare("INSERT INTO knowledge_audit_actions (id,question_id,action,actor_subject_hash,created_at) VALUES (?1,?2,?3,?4,?5)").bind(crypto.randomUUID(), id, action, actor.hash, at);

export const seedStatements = (db: D1Database, actor: AdminActor, input: { title: string; body: string; serviceIds: string[]; category: KnowledgeCategory }, id: string, hash: string, at: string, status: "draft" | "published" = "published") => [
  db.prepare("INSERT INTO knowledge_questions (id,is_anonymous,nickname,password_hash,title,body,origin,status,created_at,updated_at,category) VALUES (?1,1,NULL,?2,?3,?4,'admin_seed',?7,?5,?5,?6)").bind(id, hash, input.title, input.body, at, input.category, status),
  ...input.serviceIds.map(serviceId => db.prepare("INSERT INTO knowledge_question_services (question_id,service_id,created_at) VALUES (?1,?2,?3)").bind(id, serviceId, at)),
  audit(db, actor, "knowledge_question_created", id, at), ...(status === "published" ? [audit(db, actor, "knowledge_question_published", id, at)] : []), audit(db, actor, "knowledge_services_updated", id, at),
];
export const answerStatement = (db: D1Database, id: string, questionId: string, body: string, at: string) => db.prepare("INSERT INTO knowledge_answers (id,question_id,body,created_at,updated_at) VALUES (?1,?2,?3,?4,?4)").bind(id, questionId, body, at);

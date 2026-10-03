import { ApiError } from "../domain/errors";
import { hmacHash } from "./tokens";

const genericMessage = "질문을 등록할 수 없습니다. 입력 내용을 확인해 주세요.";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const assertKnowledgeSpamInput = (raw: Record<string, unknown>): void => {
  if (raw.website !== undefined && (typeof raw.website !== "string" || raw.website.trim() !== "")) {
    throw new ApiError(400, "HONEYPOT_REJECTED", genericMessage);
  }
  const content = `${typeof raw.title === "string" ? raw.title : ""} ${typeof raw.body === "string" ? raw.body : ""}`.normalize("NFC");
  // Existing HTML/script rejection remains a hard input boundary.
  if (/<\/?[a-z][^>]*>|javascript\s*:/iu.test(content)) throw new ApiError(400, "SPAM_REJECTED", genericMessage);
  const urls = content.match(/https?:\/\/[^\s<>]+/giu) || [];
  const repeatedUrl = urls.some(url => urls.filter(value => value === url).length >= 3);
  const advert = /무료상담|당일대출|무조건\s*승인|대출\s*승인|고수익\s*보장|원금\s*보장|가입\s*혜택|가입\s*보너스|카지노|토토\s*추천/iu.test(content);
  const contact = /(?:0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}|카톡|카카오톡|텔레그램|telegram|메신저\s*(?:id|아이디))/iu.test(content);
  const solicitation = /연락|문의|클릭|접속|가입|방문|신청/iu.test(content);
  const repeatedPhrase = /(.{4,60})\1{4,}/u.test(content);
  const repeatedCharacter = /(\S)\1{29,}/u.test(content);
  let score = 0;
  if (urls.length >= 10) score += 3;
  else if (urls.length >= 4) score += 2;
  if (repeatedUrl) score += 2;
  if (advert && (urls.length >= 3 || (contact && solicitation))) score += 2;
  if (advert && contact && solicitation) score += 1;
  if (repeatedPhrase) score += 2;
  if (repeatedPhrase && advert) score += 1;
  if (repeatedCharacter) score += 3;
  if (score >= 3) throw new ApiError(400, "SPAM_REJECTED", genericMessage);
};

export type KnowledgeAdmission = { requesterHash: string; contentHash: string; time: number };
export const knowledgeAdmission = async (pepper: string, ip: string, title: string, body: string, time = Date.now()): Promise<KnowledgeAdmission> => {
  const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ").toLowerCase();
  return {
    requesterHash: await hmacHash(pepper, "client", `knowledge:requester:${ip}`),
    contentHash: await hmacHash(pepper, "client", `knowledge:content:${JSON.stringify([normalize(title), normalize(body)])}`),
    time,
  };
};

export const assertKnowledgeAdmission = async (db: D1Database, admission: KnowledgeAdmission): Promise<void> => {
  const { requesterHash, contentHash, time } = admission;
  const counts = await db.prepare(`SELECT
    SUM(CASE WHEN requester_hash=?1 AND content_hash=?2 THEN 1 ELSE 0 END) duplicate,
    SUM(CASE WHEN content_hash=?2 AND created_at>=?3 THEN 1 ELSE 0 END) burst,
    SUM(CASE WHEN requester_hash=?1 AND created_at>=?4 THEN 1 ELSE 0 END) ten_minutes,
    SUM(CASE WHEN requester_hash=?1 THEN 1 ELSE 0 END) hourly
    FROM knowledge_submission_guards WHERE created_at>=?5`).bind(requesterHash, contentHash, time - MINUTE, time - 10 * MINUTE, time - HOUR).first<{ duplicate: number; burst: number; ten_minutes: number; hourly: number }>();
  if (counts && (counts.duplicate > 0 || counts.burst >= 3)) throw new ApiError(409, "DUPLICATE_SUBMISSION", "같은 질문이 이미 접수되었습니다. 잠시 후 다시 시도해 주세요.");
  if (counts && (counts.ten_minutes >= 5 || counts.hourly >= 12)) throw new ApiError(429, "RATE_LIMITED", "질문 등록이 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.", counts.hourly >= 12 ? 3600 : 600);
};

// Used inside the same atomic D1 batch as question/relations/receipt creation.
// Rechecking here prevents two concurrent requests from both passing preflight.
export const knowledgeAdmissionPredicate = `
  (SELECT COUNT(*) FROM knowledge_submission_guards g WHERE g.requester_hash=a.requester_hash AND g.created_at>=a.ten_min)<5
  AND (SELECT COUNT(*) FROM knowledge_submission_guards g WHERE g.requester_hash=a.requester_hash AND g.created_at>=a.hour)<12
  AND NOT EXISTS (SELECT 1 FROM knowledge_submission_guards g WHERE g.requester_hash=a.requester_hash AND g.content_hash=a.content_hash AND g.created_at>=a.hour)
  AND (SELECT COUNT(*) FROM knowledge_submission_guards g WHERE g.content_hash=a.content_hash AND g.created_at>=a.minute)<3`;

export const expiredKnowledgeGuards = (db: D1Database, time: number) => db.prepare("DELETE FROM knowledge_submission_guards WHERE created_at<?1").bind(time - HOUR);

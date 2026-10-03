import { ApiError } from "../domain/errors";
import { sha256 } from "./tokens";

export type Operation = "admin_mutation";
type Row = { request_hash: string; resource_id: string | null };

export const requestHash = (operation: Operation, target: string, payload: unknown): Promise<string> =>
  sha256(JSON.stringify({ operation, target, payload }));

export const findIdempotency = async (db: D1Database, operation: Operation, ownerHash: string, key: string): Promise<Row | null> =>
  db.prepare("SELECT request_hash, resource_id FROM knowledge_idempotency_records WHERE operation = ?1 AND owner_token_hash = ?2 AND idempotency_key = ?3 AND expires_at > ?4")
    .bind(operation, ownerHash, key, new Date().toISOString()).first<Row>();

export const assertIdempotencyMatch = (existing: Row, expectedHash: string): string | null => {
  if (existing.request_hash !== expectedHash) throw new ApiError(409, "DUPLICATE_REQUEST", "같은 요청 키가 다른 요청에 사용되었습니다.");
  return existing.resource_id;
};

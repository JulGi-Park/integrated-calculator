export const KNOWLEDGE_PUBLIC_API = "/api/knowledge/v1";

/** Shared public-only capability allowlist; never includes admin or import. */
export function isKnowledgeVisitorRequest(path: string, method: string): boolean {
  if (path === `${KNOWLEDGE_PUBLIC_API}/services`) return method === "GET";
  if (path === `${KNOWLEDGE_PUBLIC_API}/questions`) return method === "GET" || method === "POST";
  const match = /^\/api\/knowledge\/v1\/questions\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(\/verify-password)?$/iu.exec(path);
  if (!match) return false;
  return match[2] ? method === "POST" : ["GET", "PATCH", "DELETE"].includes(method);
}

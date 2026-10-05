import { isKnowledgeVisitorRequest } from "../lib/knowledge/public-api";

export type KnowledgeService = { fetch(request: Request): Promise<Response> };
export type KnowledgeTransportEnv = { KNOWLEDGE_SERVICE?: KnowledgeService };

/** Binding only: no Internet fallback, including when the binding is missing. */
export async function knowledgeServiceFetch(env: KnowledgeTransportEnv, request: Request): Promise<Response> {
  if (!isKnowledgeVisitorRequest(new URL(request.url).pathname, request.method)) throw new Error("KNOWLEDGE_PUBLIC_PATH_DENIED");
  if (!env.KNOWLEDGE_SERVICE || typeof env.KNOWLEDGE_SERVICE.fetch !== "function") throw new Error("KNOWLEDGE_SERVICE_MISSING");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error("KNOWLEDGE_SERVICE_TIMEOUT")); }, 8000);
    });
    const response = await Promise.race([
      env.KNOWLEDGE_SERVICE.fetch(new Request(request, { redirect: "manual", signal: controller.signal })), timedOut,
    ]);
    if (response.status >= 300 && response.status < 400) throw new Error("KNOWLEDGE_SERVICE_REDIRECT_DENIED");
    return response;
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

export function knowledgeReadRequest(path: string): Request {
  return new Request(`https://knowledge.internal/api/knowledge/v1${path}`, { headers: { Accept: "application/json" } });
}

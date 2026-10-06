import type { KnowledgePagesEnv } from "../../../pages-functions/knowledge-seo";

const PROBE_PATH = "/api/internal/knowledge-binding-probe";
const EXPECTED_PROBE_RESULT = "knowledge-binding-probe-v1";
const SAFE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: SAFE_HEADERS });
}

function constantTimeTokenMatch(expected: string, supplied: string): boolean {
  const expectedBytes = new TextEncoder().encode(expected);
  const suppliedBytes = new TextEncoder().encode(supplied);
  if (expectedBytes.length === 0 || suppliedBytes.length > 512) return false;
  let difference = expectedBytes.length ^ suppliedBytes.length;
  const maxLength = Math.max(expectedBytes.length, suppliedBytes.length);
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (expectedBytes[index] ?? 0) ^ (suppliedBytes[index] ?? 0);
  }
  return difference === 0;
}

function unavailable(): Response {
  return new Response(null, { status: 503, headers: SAFE_HEADERS });
}

export async function onRequest(context: {
  request: Request;
  env: KnowledgePagesEnv;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.pathname !== PROBE_PATH || request.method !== "GET"
    || url.hostname !== "gyesanbox.kr") return notFound();

  const expected = env.KNOWLEDGE_BINDING_PROBE_TOKEN;
  const supplied = request.headers.get("X-Knowledge-Binding-Probe-Token") ?? "";
  if (!expected || !constantTimeTokenMatch(expected, supplied)) return notFound();

  const service = env.KNOWLEDGE_SERVICE;
  if (!service || typeof service.probe !== "function") return unavailable();
  try {
    const result = await service.probe();
    if (result !== EXPECTED_PROBE_RESULT) return unavailable();
    return new Response(null, { status: 204, headers: SAFE_HEADERS });
  } catch {
    return unavailable();
  }
}

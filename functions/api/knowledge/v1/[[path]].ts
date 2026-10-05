import { isKnowledgeVisitorRequest } from "../../../../lib/knowledge/public-api";
import { resolveKnowledgeRuntime, notFound, type KnowledgePagesEnv } from "../../../../pages-functions/knowledge-seo";
import { knowledgeServiceFetch } from "../../../../pages-functions/knowledge-transport";

const error = (status: number, code: string) => Response.json({ ok: false, error: { code, message: code } }, {
  status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" },
});

export async function onRequest(context: { request: Request; env: KnowledgePagesEnv }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!resolveKnowledgeRuntime(url, env) || !isKnowledgeVisitorRequest(url.pathname, request.method)) return notFound();
  const origin = request.headers.get("Origin");
  if ((origin !== null && origin !== url.origin) || (request.method !== "GET" && origin === null)) return error(403, "FORBIDDEN");
  const headers = new Headers();
  // CF-Connecting-IP is supplied by the Pages edge. No client X-Forwarded-For,
  // cookies, Authorization, Access JWT or admin/trust headers cross this boundary.
  for (const name of ["Accept", "Content-Type", "Idempotency-Key", "Origin", "CF-Connecting-IP"]) {
    const value = request.headers.get(name); if (value !== null) headers.set(name, value);
  }
  const target = new URL(url.pathname + url.search, "https://knowledge.internal");
  try {
    const forwarded = new Request(target, { method: request.method, headers,
      body: request.method === "GET" ? undefined : request.body, redirect: "manual",
      ...({ duplex: "half" } as Record<string, string>),
    });
    const upstream = await knowledgeServiceFetch(env, forwarded);
    const responseHeaders = new Headers();
    for (const name of ["Content-Type", "Retry-After", "X-Request-ID"]) {
      const value = upstream.headers.get(name); if (value !== null) responseHeaders.set(name, value);
    }
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch { return error(503, "SERVICE_UNAVAILABLE"); }
}

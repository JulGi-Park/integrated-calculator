import { notFound, resolveKnowledgeRuntime, unavailable, type KnowledgePageFunctionContext } from "../../pages-functions/knowledge-seo";

/** Static UI assets remain unchanged; only this route's access/robots are runtime-controlled. */
export const onRequestGet = async (context: KnowledgePageFunctionContext & { next(): Promise<Response> }): Promise<Response> => {
  const runtime = resolveKnowledgeRuntime(new URL(context.request.url), context.env);
  if (!runtime) return notFound();
  if (!runtime.KNOWLEDGE_SERVICE) return unavailable();
  const response = await context.next();
  if (response.status !== 200 || !response.headers.get("content-type")?.includes("text/html")) return response;
  const html = await response.text();
  const robotsTag = /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gu;
  if ([...html.matchAll(robotsTag)].length !== 1) return unavailable();
  const robots = runtime.indexEnabled ? "index, follow" : "noindex, nofollow, noarchive";
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", runtime.indexEnabled ? "index, follow" : "noindex");
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.delete("Content-Encoding");
  return new Response(html.replace(robotsTag, `<meta name="robots" content="${robots}">`), { status: 200, headers });
};

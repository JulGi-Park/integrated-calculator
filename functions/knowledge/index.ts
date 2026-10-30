import { fetchPublicQuestionPage, notFound, resolveKnowledgeRuntime, unavailable, type KnowledgePageFunctionContext } from "../../pages-functions/knowledge-seo";
import { renderKnowledgeList } from "../../pages-functions/knowledge-list";

/** Enhance the static export with public HTML; retain its React shell and metadata. */
export const onRequestGet = async (context: KnowledgePageFunctionContext & { next(): Promise<Response> }): Promise<Response> => {
  const runtime = resolveKnowledgeRuntime(new URL(context.request.url), context.env);
  if (!runtime) return notFound();
  if (!runtime.KNOWLEDGE_SERVICE) return unavailable();
  const url = new URL(context.request.url);
  const values = url.searchParams.getAll("page");
  const pageText = values[0] ?? "1";
  if (values.length > 1 || !/^[1-9]\d*$/u.test(pageText) || !Number.isSafeInteger(Number(pageText))) return notFound();
  let data;
  try { data = await fetchPublicQuestionPage(runtime, Number(pageText)); }
  catch { return unavailable(); }
  if (data.page > data.totalPages) return notFound();
  const response = await context.next();
  if (response.status !== 200 || !response.headers.get("content-type")?.includes("text/html")) return response;
  const html = await response.text();
  const robotsTag = /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gu;
  if ([...html.matchAll(robotsTag)].length !== 1) return unavailable();
  const island = '<div id="knowledge-server-list"></div>';
  if (html.split(island).length !== 2 || !html.includes("</head>")) return unavailable();
  const robots = runtime.indexEnabled ? "index, follow" : "noindex, nofollow, noarchive";
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", runtime.indexEnabled ? "index, follow" : "noindex");
  headers.delete("Content-Length");
  headers.delete("ETag");
  headers.delete("Content-Encoding");
  const rendered = html.replace(robotsTag, `<meta name="robots" content="${robots}">`)
    .replace("</head>", '<link rel="stylesheet" href="/knowledge-list.css"></head>')
    .replace(island, () => `<div id="knowledge-server-list">${renderKnowledgeList(data)}</div>`);
  return new Response(rendered, { status: 200, headers });
};

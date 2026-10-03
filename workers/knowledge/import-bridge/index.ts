// Local-only operator bridge for Preview import RPC. Never deploy this Worker.
export default {
  async fetch(request: Request, env: { KNOWLEDGE_IMPORT: { call(tool: string, input: unknown): Promise<unknown> }; IMPORT_SESSION_KEY: string }): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/import-rpc"
      || !env.IMPORT_SESSION_KEY || request.headers.get("X-Import-Session") !== env.IMPORT_SESSION_KEY) {
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    if (Number(request.headers.get("Content-Length") ?? 0) > 512 * 1024) {
      return new Response("Payload too large", { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    const payload = await request.json() as { tool?: unknown; input?: unknown };
    if (typeof payload.tool !== "string") return new Response("Invalid request", { status: 400 });
    const result = await env.KNOWLEDGE_IMPORT.call(payload.tool, payload.input);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  },
};

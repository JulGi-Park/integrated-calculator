import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const outputRoot = path.resolve(process.cwd(), "out");
const port = Number(process.env.AUDIT_PORT ?? 4173);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

async function resolveFile(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidates = pathname.endsWith("/")
    ? [path.join(relative, "index.html")]
    : [relative, path.join(relative, "index.html")];

  for (const candidate of candidates) {
    const absolute = path.resolve(outputRoot, candidate);
    if (absolute !== outputRoot && !absolute.startsWith(`${outputRoot}${path.sep}`)) {
      continue;
    }
    try {
      if ((await stat(absolute)).isFile()) return absolute;
    } catch {
      // Try the next static export candidate.
    }
  }
  return null;
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const target = await resolveFile(pathname);
    const status = target ? 200 : 404;
    const file = target ?? path.join(outputRoot, "404.html");
    const body = await readFile(file);
    response.writeHead(status, {
      "cache-control": "no-store",
      "content-type": contentTypes.get(path.extname(file)) ?? "application/octet-stream",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Static audit server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static audit server listening on http://127.0.0.1:${port}`);
});

import { writeFile } from "node:fs/promises";
import path from "node:path";

const routes = {
  version: 1,
  include: ["/knowledge", "/knowledge/*", "/sitemap-knowledge.xml", "/api/knowledge/v1", "/api/knowledge/v1/*", "/api/internal/knowledge-binding-probe"],
  exclude: [],
};

await writeFile(path.join(process.cwd(), "out", "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

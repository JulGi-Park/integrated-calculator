import { writeFile } from "node:fs/promises";
import path from "node:path";

const routes = {
  version: 1,
  include: ["/knowledge/*", "/sitemap-knowledge.xml"],
  exclude: ["/knowledge", "/knowledge/"],
};

await writeFile(path.join(process.cwd(), "out", "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

import type { MetadataRoute } from "next";
import { knowledgeRobotsSitemaps } from "@/lib/knowledge/robots.mjs";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: knowledgeRobotsSitemaps(process.env),
  };
}

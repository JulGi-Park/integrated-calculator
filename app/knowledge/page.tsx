import type { Metadata } from "next";
import { KnowledgeCenter } from "@/components/knowledge/KnowledgeCenter";

export const metadata: Metadata = { title: "계산박스 지식센터", description: "계산박스 지식센터에서 질문과 공식답변을 확인하세요.", alternates: { canonical: "https://gyesanbox.kr/knowledge/" }, robots: { index: false, follow: false } };

export default function KnowledgePage() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW === "true";
  return <KnowledgeCenter apiBase={enabled ? (process.env.NEXT_PUBLIC_KNOWLEDGE_API_BASE ?? "") : ""} />;
}

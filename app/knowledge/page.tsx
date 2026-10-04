import type { Metadata } from "next";
import { KnowledgeCenter } from "@/components/knowledge/KnowledgeCenter";
import { knowledgeBuildGates } from "@/lib/knowledge/gates";

export function generateMetadata(): Metadata {
  const { indexEnabled } = knowledgeBuildGates(process.env);
  return { title: "계산박스 지식센터", description: "계산박스 지식센터에서 질문과 공식답변을 확인하세요.", alternates: { canonical: "https://gyesanbox.kr/knowledge/" }, robots: { index: indexEnabled, follow: indexEnabled } };
}

export default function KnowledgePage() {
  const enabled = knowledgeBuildGates(process.env).publicEnabled;
  return <KnowledgeCenter apiBase={enabled ? (process.env.NEXT_PUBLIC_KNOWLEDGE_API_BASE ?? "") : ""} />;
}

"use client";
import { useEffect, useState } from "react";
import { knowledgeDetailPath } from "../../lib/knowledge/seo";
import styles from "./KnowledgeLatestQuestions.module.css";
import { KNOWLEDGE_PUBLIC_API } from "../../lib/knowledge/public-api";
type Item = {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
  answer: unknown;
  status?: string;
};

type PublicPayload = { ok?: boolean; data?: { items?: unknown } };

function isItem(value: unknown): value is Item {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<Item>;
  if (typeof item.id !== "string" || typeof item.title !== "string" || !item.title.trim()) return false;
  if (item.status !== undefined && item.status !== "published") return false;
  if (item.category !== null && typeof item.category !== "string") return false;
  if (typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))) return false;
  try {
    knowledgeDetailPath(item.id);
    return true;
  } catch {
    return false;
  }
}

function formatKoreanDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function KnowledgeLatestQuestions({ enabled }: { enabled: boolean }) {
  const apiBase = enabled ? KNOWLEDGE_PUBLIC_API : "";
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    if (!apiBase) return;
    void fetch(`${apiBase}/questions?limit=5&page=1`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("KNOWLEDGE_LATEST_REQUEST_FAILED");
        const payload = await response.json() as PublicPayload;
        if (payload.ok !== true || !Array.isArray(payload.data?.items)) {
          throw new Error("KNOWLEDGE_LATEST_RESPONSE_INVALID");
        }
        setItems(payload.data.items.filter(isItem).slice(0, 5));
      })
      .catch(() => setItems([]));
  }, [apiBase]);
  if (!apiBase || !items.length) return null;
  return (
    <section className={styles.section} aria-labelledby="knowledge-latest-title">
      <div className={styles.heading}>
        <h2 id="knowledge-latest-title">지식센터 최신 질문</h2>
        <a href="/knowledge/">전체 질문 보기 <span aria-hidden="true">→</span></a>
      </div>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a className={styles.item} href={knowledgeDetailPath(item.id)}>
              <span className={styles.itemMain}>
                <strong className={styles.title}>{item.title}</strong>
                <span className={styles.meta}>
                  <span>{item.category || "일반"}</span>
                  <span>{item.answer ? "답변 완료" : "답변 대기"}</span>
                </span>
              </span>
              <time className={styles.date} dateTime={item.createdAt}>
                {formatKoreanDate(item.createdAt)}
              </time>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

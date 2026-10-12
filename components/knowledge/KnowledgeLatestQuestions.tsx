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
type LoadState = "loading" | "success" | "empty" | "error";
type LoadResult = { apiBase: string; status: LoadState; items: Item[] };

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
  const [loadResult, setLoadResult] = useState<LoadResult>({ apiBase: "", status: "loading", items: [] });
  useEffect(() => {
    if (!apiBase) return;
    let active = true;
    void fetch(`${apiBase}/questions?limit=5&page=1`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("KNOWLEDGE_LATEST_REQUEST_FAILED");
        const payload = await response.json() as PublicPayload;
        if (payload.ok !== true || !Array.isArray(payload.data?.items)) {
          throw new Error("KNOWLEDGE_LATEST_RESPONSE_INVALID");
        }
        if (!active) return;
        const nextItems = payload.data.items.filter(isItem).slice(0, 5);
        setLoadResult({ apiBase, status: nextItems.length ? "success" : "empty", items: nextItems });
      })
      .catch(() => {
        if (!active) return;
        setLoadResult({ apiBase, status: "error", items: [] });
      });
    return () => { active = false; };
  }, [apiBase]);
  if (!apiBase) return null;

  const currentResult: LoadResult = loadResult.apiBase === apiBase
    ? loadResult
    : { apiBase, status: "loading", items: [] };
  const { status: loadState, items } = currentResult;

  const statusMessage = {
    loading: "최신 질문을 가져오는 중...",
    success: `최신 질문 ${items.length}건을 불러왔습니다.`,
    empty: "등록된 질문이 없습니다.",
    error: "최신 질문을 불러오지 못했습니다.",
  }[loadState];

  return (
    <section className={styles.section} aria-labelledby="knowledge-latest-title" aria-busy={loadState === "loading"}>
      <div className={styles.heading}>
        <h2 id="knowledge-latest-title">지식센터 최신 질문</h2>
        <a href="/knowledge/">전체 질문 보기 <span aria-hidden="true">→</span></a>
      </div>
      <p
        className={`${styles.stateMessage} ${loadState === "loading" ? styles.loadingMessage : ""} ${loadState === "success" ? styles.visuallyHidden : ""}`}
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </p>
      {loadState === "success" ? (
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
      ) : null}
    </section>
  );
}

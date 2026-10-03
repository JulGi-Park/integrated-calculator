"use client";
import { useEffect, useState } from "react";
import { knowledgeDetailPath } from "../../lib/knowledge/seo";
import styles from "./KnowledgeLatestQuestions.module.css";
type Item = { id: string; title: string; isAnonymous: boolean; nickname: string | null; createdAt: string; answer: unknown };
export function KnowledgeLatestQuestions({ apiBase }: { apiBase: string }) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { if (!apiBase) return; void fetch(`${apiBase}/questions?limit=5&page=1`, { cache: "no-store" }).then((r) => r.json()).then((payload: { data?: { items?: Item[] } }) => setItems(payload.data?.items ?? [])).catch(() => setItems([])); }, [apiBase]);
  if (!apiBase || !items.length) return null;
  return <section className={styles.section} aria-labelledby="knowledge-latest-title"><div className={styles.heading}><div><p className={styles.eyebrow}>Knowledge center</p><h2 id="knowledge-latest-title">지식센터 최신 질문</h2></div><a href="/knowledge/">전체 질문 보기</a></div><div className={styles.list}>{items.map((item) => <a className={styles.item} href={knowledgeDetailPath(item.id)} key={item.id}><strong>{item.title}</strong><span>{item.isAnonymous ? "익명" : item.nickname} · {item.answer ? "답변 완료" : "답변 대기"}</span></a>)}</div></section>;
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { KnowledgeQuestionEditor } from "./KnowledgeQuestionEditor";
import { buildVisitorQuestionCreatePayload } from "../../lib/knowledge/visitor-contract";
import { KNOWLEDGE_CATEGORIES } from "../../lib/knowledge/categories";
import { knowledgeDetailPath } from "../../lib/knowledge/seo";
import styles from "./KnowledgeCenter.module.css";

type Service = { id: string; slug: string; name: string };
type Answer = { id: string; body: string; created_at: string; updated_at: string } | null;
type Question = { id: string; title: string; body: string; category: string | null; isAnonymous: boolean; nickname: string | null; status: string; createdAt: string; updatedAt: string; answer: Answer; relatedServices: Service[] };
type Envelope<T> = { ok: boolean; data?: T; error?: { message?: string } };
const TURNSTILE_SITEKEY = "0x4AAAAAAE59wsbNGbwWKWMC";
const mobileQuery = "(max-width: 760px)";
const subscribeViewport = (callback: () => void) => {
  const media = typeof window.matchMedia === "function" ? window.matchMedia(mobileQuery) : null;
  media?.addEventListener("change", callback);
  return () => media?.removeEventListener("change", callback);
};
const mobileSnapshot = () => typeof window.matchMedia === "function" && window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;

const date = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));

const pageWindow = (current: number, total: number): Array<number | "ellipsis-start" | "ellipsis-end"> => {
  if (total <= 1) return [1];
  const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) pages.push("ellipsis-start");
  for (let page = start; page <= end; page++) pages.push(page);
  if (end < total - 1) pages.push("ellipsis-end");
  pages.push(total);
  return pages;
};

export function KnowledgeCenter({ apiBase }: { apiBase: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const mobile = useSyncExternalStore(subscribeViewport, mobileSnapshot, serverSnapshot);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<unknown>(null);
  const [form, setForm] = useState({ title: "", category: "", website: "", anonymous: true, nickname: "", password: "", body: "", serviceIds: [] as string[] });
  const currentPageRef = useRef(1);
  const queryRef = useRef("");
  const categoryRef = useRef("");
  const listTopRef = useRef<HTMLDivElement>(null);

  const call = useCallback(async <T,>(path: string, init?: RequestInit) => {
    const response = await fetch(`${apiBase}${path}`, { ...init, cache: "no-store", credentials: "omit", headers: { Accept: "application/json", "Content-Type": "application/json", ...(init?.headers || {}) } });
    const payload = await response.json() as Envelope<T>;
    if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "지식센터 요청에 실패했습니다.");
    return payload.data as T;
  }, [apiBase]);

  const loadServices = useCallback(async () => setServices((await call<{ items: Service[] }>("/services")).items), [call]);
  const loadList = useCallback(async (nextPage = 1, nextQuery = queryRef.current, nextCategory = categoryRef.current) => {
    if (nextPage !== currentPageRef.current) { setSelected(null); setEditing(false); }
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ limit: "10", page: String(nextPage) });
      if (nextQuery) params.set("q", nextQuery);
      if (nextCategory) params.set("category", nextCategory);
      const data = await call<{ items: Question[]; page?: number; total?: number; total_pages: number }>(`/questions?${params.toString()}`);
      const loadedPage = data.page ?? nextPage;
      setItems(data.items); setPage(loadedPage); setTotal(data.total ?? data.items.length); setTotalPages(data.total_pages);
      if (loadedPage !== currentPageRef.current) {
        currentPageRef.current = loadedPage;
        requestAnimationFrame(() => listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "지식센터를 불러오지 못했습니다."); }
    finally { setLoading(false); }
  }, [call]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data synchronization belongs to the client preview.
  useEffect(() => { if (!apiBase) return; void Promise.all([loadServices(), loadList()]).catch(() => undefined); }, [apiBase, loadList, loadServices]);
  useEffect(() => { if (typeof window === "undefined" || !apiBase) return; const w = window as Window & { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => unknown; reset: (id?: unknown) => void } }; const mount = () => { if (!widgetRef.current || !w.turnstile || widgetId.current !== null) return; widgetId.current = w.turnstile.render(widgetRef.current, { sitekey: TURNSTILE_SITEKEY, language: "ko", callback: (token: string) => setTurnstileToken(token), "expired-callback": () => setTurnstileToken(""), "error-callback": () => setTurnstileToken("") }); }; if (w.turnstile) mount(); else { const script = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]') || document.createElement("script"); if (!script.src) { script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.defer = true; document.head.appendChild(script); } script.addEventListener("load", mount, { once: true }); return () => script.removeEventListener("load", mount); } }, [apiBase]);

  const resetToken = () => { const w = window as Window & { turnstile?: { reset: (id?: unknown) => void } }; if (w.turnstile) w.turnstile.reset(widgetId.current || undefined); setTurnstileToken(""); };
  const toggleService = (id: string) => setForm((value) => ({ ...value, serviceIds: value.serviceIds.includes(id) ? value.serviceIds.filter((item) => item !== id) : [...value.serviceIds, id] }));
  const openQuestion = useCallback(async (id: string, preserveNotice = false) => { try { const detail = await call<{ question: Question }>(`/questions/${id}`); setSelected(detail.question); setEditing(false); setError(""); if (!preserveNotice) setNotice(""); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "질문을 불러오지 못했습니다."); return false; } }, [call]);
  const toggleQuestion = (id: string) => {
    if (selected?.id === id) {
      setSelected(null);
      setEditing(false);
      setError("");
      setNotice("");
      return;
    }
    setSelected(null);
    setEditing(false);
    void openQuestion(id);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- query-string deep links select the requested question after mount.
  useEffect(() => { if (!apiBase || typeof window === "undefined") return; const id = new URLSearchParams(window.location.search).get("id"); if (id) void openQuestion(id); }, [apiBase, openQuestion]);
  const startEdit = () => { if (!selected || selected.answer) return; setEditing(true); setNotice(""); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (submitting) return; setSubmitting(true); setNotice(""); setError(""); try { if (!turnstileToken) throw new Error("사람인지 확인을 완료해 주세요."); const result = await call<{ id: string }>("/questions", { method: "POST", body: JSON.stringify(buildVisitorQuestionCreatePayload(form, turnstileToken)) }); await loadList(1); await openQuestion(result.id, true); setForm({ title: "", category: "", website: "", anonymous: true, nickname: "", password: "", body: "", serviceIds: [] }); setNotice("질문이 등록되었습니다."); } catch (cause) { setError(cause instanceof Error ? cause.message : "저장하지 못했습니다."); } finally { resetToken(); setSubmitting(false); } };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    setSearchInput(nextQuery);
    setQuery(nextQuery);
    queryRef.current = nextQuery;
    setSelected(null);
    setEditing(false);
    setNotice("");
    void loadList(1, nextQuery, categoryRef.current);
  };
  const clearSearch = () => {
    setSearchInput("");
    setQuery("");
    queryRef.current = "";
    setSelected(null);
    setEditing(false);
    setNotice("");
    void loadList(1, "", categoryRef.current);
  };
  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    categoryRef.current = nextCategory;
    setSelected(null);
    setEditing(false);
    setNotice("");
    void loadList(1, queryRef.current, nextCategory);
  };

  const selectedServices = useMemo(() => selected?.relatedServices || [], [selected]);
  const renderQuestionDetail = (className: string, testId: string) => selected ? <div className={`${styles.detail} ${className}`} data-testid={testId} role="region" aria-label={`질문 상세: ${selected.title}`}>
    <div className={styles.detailHead}><div><p className={styles.eyebrow}>{selected.isAnonymous ? "익명" : selected.nickname}</p><h2>{selected.title}</h2><time>{date(selected.createdAt)}</time>{selected.category ? <p>{selected.category}</p> : null}</div>{!selected.answer ? <><span className={styles.editable}>답변 전 수정 가능</span><button type="button" onClick={startEdit}>질문 수정</button></> : <span className={styles.locked}>공식답변 후 수정 잠금</span>}</div>
    <p className={styles.body}>{selected.body}</p><div className={styles.services}>{selectedServices.map((service) => <a key={service.id} href={`/calculators/${service.slug}/`}>{service.name}</a>)}</div>
    <section className={styles.answer}><h3>계산박스 공식답변</h3>{selected.answer ? <p className={styles.body}>{selected.answer.body}</p> : <p>아직 공식답변이 없습니다. 답변 대기 중입니다.</p>}</section>
    {editing && !selected.answer && (mobile ? testId === "inline-question-detail" : testId === "desktop-question-detail") ? <KnowledgeQuestionEditor key={selected.id} question={selected} sitekey={TURNSTILE_SITEKEY} call={call} onCancel={() => setEditing(false)} onSaved={async () => { const id = selected.id; setEditing(false); if (await openQuestion(id, true)) { await loadList(page); setNotice("질문이 수정되었습니다."); } }} /> : null}
  </div> : null;
  if (!apiBase) return <section className={styles.shell}><p className={styles.error}>Preview에서만 제공되는 지식센터입니다.</p></section>;
  return <main className={styles.shell} aria-labelledby="knowledge-title">
    <header className={styles.header}><p className={styles.eyebrow}>Knowledge center</p><h1 id="knowledge-title">계산박스 지식센터</h1><p>궁금한 내용을 남기면 계산박스가 공식 답변을 안내합니다.</p></header>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    {error ? <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); void loadList(page); }}>다시 시도</button></div> : null}
    <section className={styles.layout}>
      <div><div className={styles.listHeading} ref={listTopRef}><h2>최신 질문</h2><span>{query ? `검색 결과 ${total}건` : category ? `${category} 질문 ${total}건` : `전체 ${total}건`}</span></div><div className={styles.searchTools}>
        <form className={styles.searchForm} role="search" onSubmit={submitSearch}><label className={styles.searchLabel}><span className={styles.visuallyHidden}>질문 제목이나 내용 검색</span><input type="search" value={searchInput} maxLength={50} placeholder="질문 제목이나 내용 검색" onChange={(event) => setSearchInput(event.target.value)} /></label><button className={styles.searchButton} type="submit">검색</button>{query ? <button className={styles.clearButton} type="button" onClick={clearSearch}>검색어 지우기</button> : null}</form>
        <label className={styles.categoryFilter}><span>카테고리</span><select aria-label="카테고리 필터" value={category} onChange={(event) => changeCategory(event.target.value)}><option value="">전체 카테고리</option>{KNOWLEDGE_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>{loading ? <p role="status">질문을 불러오는 중입니다.</p> : null}<div className={styles.list}>{!loading && !items.length ? <p className={styles.empty}>{query ? "검색 결과가 없습니다." : category ? "선택한 카테고리에 공개된 질문이 없습니다." : "등록된 질문이 없습니다."}</p> : null}{items.map((item) => <div className={styles.questionItem} key={item.id}><button className={`${styles.row} ${selected?.id === item.id ? styles.selected : ""}`} type="button" aria-expanded={selected?.id === item.id} onClick={() => toggleQuestion(item.id)}><strong>{item.title}</strong><span>{item.category ? `${item.category} · ` : ""}{item.isAnonymous ? "익명" : item.nickname} · {date(item.createdAt)} · {item.answer ? "답변 완료" : "답변 대기"}</span></button>{selected?.id === item.id ? renderQuestionDetail(styles.mobileQuestionDetail, "inline-question-detail") : null}<a className={styles.detailLink} href={knowledgeDetailPath(item.id)}>질문 상세</a></div>)}</div>{totalPages > 1 ? <><nav className={styles.pagination} aria-label="질문 페이지 번호" data-testid="desktop-pagination"><button type="button" disabled={page === 1} onClick={() => void loadList(page - 1)}>이전</button>{pageWindow(page, totalPages).map((entry) => typeof entry === "number" ? <button type="button" key={entry} aria-current={entry === page ? "page" : undefined} aria-label={`${entry}페이지`} className={entry === page ? styles.current : ""} onClick={() => void loadList(entry)}>{entry}</button> : <span aria-hidden="true" key={entry}>…</span>)}<button type="button" disabled={page === totalPages} onClick={() => void loadList(page + 1)}>다음</button></nav><nav className={styles.mobilePagination} aria-label="질문 페이지 이동" data-testid="mobile-pagination"><button type="button" disabled={page === 1} onClick={() => void loadList(page - 1)}>이전</button><span aria-live="polite">{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => void loadList(page + 1)}>다음</button></nav></> : null}</div>
      {selected ? renderQuestionDetail(styles.desktopDetail, "desktop-question-detail") : <div className={`${styles.detail} ${styles.desktopDetail}`}><p className={styles.empty}>질문을 선택하면 상세 내용을 확인할 수 있습니다.</p></div>}
    </section>
    <section className={styles.composer} aria-labelledby="ask-title"><h2 id="ask-title">질문 등록</h2><form onSubmit={submit}><label className={styles.honeypot} aria-hidden="true">웹사이트<input name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={512} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label><label>카테고리<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required><option value="">카테고리 선택</option>{KNOWLEDGE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label>제목<input value={form.title} maxLength={120} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label className={styles.check}><input type="checkbox" checked={form.anonymous} onChange={(event) => setForm({ ...form, anonymous: event.target.checked })} /> 익명으로 등록</label>{!form.anonymous ? <label>닉네임<input value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} required /></label> : null}<label>비밀번호<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={4} required /></label><label>질문 내용<textarea value={form.body} maxLength={4000} onChange={(event) => setForm({ ...form, body: event.target.value })} required /></label><fieldset><legend>관련 계산기</legend><div className={styles.services}>{services.map((service) => <label className={styles.check} key={service.id}><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />{service.name}</label>)}</div></fieldset><div ref={widgetRef} className={styles.turnstile} /><button className={styles.primary} type="submit" disabled={submitting}>{submitting ? "등록 중..." : "질문 등록"}</button></form></section>
  </main>;
}

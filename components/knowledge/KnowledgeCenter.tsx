"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KnowledgeQuestionEditor } from "./KnowledgeQuestionEditor";
import { buildVisitorQuestionCreatePayload, visitorPasswordPolicyError } from "../../lib/knowledge/visitor-contract";
import { KNOWLEDGE_CATEGORIES } from "../../lib/knowledge/categories";
import { knowledgeDetailPath } from "../../lib/knowledge/seo";
import { KNOWLEDGE_PUBLIC_API } from "../../lib/knowledge/public-api";
import styles from "./KnowledgeCenter.module.css";

type Service = { id: string; slug: string; name: string };
type Answer = { id: string; body: string; created_at: string; updated_at: string } | null;
type Question = { id: string; title: string; body: string; category: string | null; isAnonymous: boolean; nickname: string | null; status: string; createdAt: string; updatedAt: string; answer: Answer; relatedServices: Service[] };
type Envelope<T> = { ok: boolean; data?: T; error?: { message?: string } };
type VisitorField = "title" | "body" | "nickname" | "password" | "category";
const TURNSTILE_SITEKEY = "0x4AAAAAAE59wsbNGbwWKWMC";
const isMobileViewport = () => typeof window.matchMedia === "function"
  ? window.matchMedia("(max-width: 760px)").matches
  : window.innerWidth <= 760;
type EditSession = { questionId: string; placement: "inline" | "desktop" };

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

export function KnowledgeCenter({ enabled }: { enabled: boolean }) {
  const apiBase = enabled ? KNOWLEDGE_PUBLIC_API : "";
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [composerMounted, setComposerMounted] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<VisitorField, string>>>({});
  // The edit session is bound to both its record and the responsive detail
  // surface selected at click time. The create form below remains independent.
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const [, setTurnstileToken] = useState("");
  const [turnstileVisible, setTurnstileVisible] = useState(false);
  const [turnstilePrompt, setTurnstilePrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLSelectElement>(null);
  const widgetId = useRef<unknown>(null);
  const turnstileTokenRef = useRef("");
  const pendingTurnstileSubmitRef = useRef(false);
  const [form, setForm] = useState({ title: "", category: "", website: "", anonymous: true, nickname: "", password: "", body: "", serviceIds: [] as string[] });
  const currentPageRef = useRef(1);
  const queryRef = useRef("");
  const categoryRef = useRef("");
  const listTopRef = useRef<HTMLDivElement>(null);

  const call = useCallback(async <T,>(path: string, init?: RequestInit, expectedStatus?: number) => {
    const response = await fetch(`${apiBase}${path}`, { ...init, cache: "no-store", credentials: "omit", headers: { Accept: "application/json", "Content-Type": "application/json", ...(init?.headers || {}) } });
    const payload = await response.json() as Envelope<T>;
    if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "지식센터 요청에 실패했습니다.");
    if (expectedStatus !== undefined && response.status !== expectedStatus) throw new Error("질문 등록 응답을 확인하지 못했습니다. 입력 내용은 유지됩니다.");
    return payload.data as T;
  }, [apiBase]);

  const loadServices = useCallback(async () => setServices((await call<{ items: Service[] }>("/services")).items), [call]);
  const loadList = useCallback(async (nextPage = 1, nextQuery = queryRef.current, nextCategory = categoryRef.current) => {
    if (nextPage !== currentPageRef.current) { setSelected(null); setEditSession(null); }
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
  useEffect(() => { if (typeof window === "undefined" || !apiBase || !composerMounted || !turnstileVisible) return; const w = window as Window & { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => unknown; reset: (id?: unknown) => void } }; const mount = () => { if (!widgetRef.current || !w.turnstile || widgetId.current !== null) return; widgetId.current = w.turnstile.render(widgetRef.current, { sitekey: TURNSTILE_SITEKEY, language: "ko", callback: (token: string) => { turnstileTokenRef.current = token; setTurnstileToken(token); setTurnstilePrompt(""); if (pendingTurnstileSubmitRef.current) { pendingTurnstileSubmitRef.current = false; createFormRef.current?.requestSubmit(); } }, "expired-callback": () => { turnstileTokenRef.current = ""; setTurnstileToken(""); }, "error-callback": () => { turnstileTokenRef.current = ""; setTurnstileToken(""); } }); }; if (w.turnstile) mount(); else { const script = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]') || document.createElement("script"); if (!script.src) { script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.defer = true; document.head.appendChild(script); } script.addEventListener("load", mount, { once: true }); return () => script.removeEventListener("load", mount); } }, [apiBase, composerMounted, turnstileVisible]);

  const resetToken = () => { const w = window as Window & { turnstile?: { reset: (id?: unknown) => void } }; if (w.turnstile) w.turnstile.reset(widgetId.current || undefined); turnstileTokenRef.current = ""; pendingTurnstileSubmitRef.current = false; setTurnstileToken(""); setTurnstilePrompt(""); };
  const toggleComposer = () => {
    if (composerOpen) resetToken();
    else setComposerMounted(true);
    setComposerOpen((value) => !value);
  };
  const toggleService = (id: string) => setForm((value) => ({ ...value, serviceIds: value.serviceIds.includes(id) ? value.serviceIds.filter((item) => item !== id) : [...value.serviceIds, id] }));
  const openQuestion = useCallback(async (id: string, preserveNotice = false) => { try { const detail = await call<{ question: Question }>(`/questions/${id}`); setSelected(detail.question); setEditSession(null); setError(""); if (!preserveNotice) setNotice(""); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : "질문을 불러오지 못했습니다."); return false; } }, [call]);
  const toggleQuestion = (id: string) => {
    if (selected?.id === id) {
      setSelected(null);
      setEditSession(null);
      setError("");
      setNotice("");
      return;
    }
    setSelected(null);
    setEditSession(null);
    void openQuestion(id);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- query-string deep links select the requested question after mount.
  useEffect(() => { if (!apiBase || typeof window === "undefined") return; const id = new URLSearchParams(window.location.search).get("id"); if (id) void openQuestion(id); }, [apiBase, openQuestion]);
  const startEdit = (questionId: string) => {
    if (!selected || selected.id !== questionId || selected.answer) return;
    setEditSession({ questionId, placement: isMobileViewport() ? "inline" : "desktop" });
    setNotice("");
    setError("");
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setNotice("");
    setError("");
    setSubmitError("");

    const passwordError = visitorPasswordPolicyError(form.password);
    const invalid: { field: VisitorField; message: string } | null =
      !KNOWLEDGE_CATEGORIES.includes(form.category as typeof KNOWLEDGE_CATEGORIES[number]) ? { field: "category", message: "카테고리를 선택해 주세요." }
        : !form.title.trim() ? { field: "title", message: "질문 제목을 입력해 주세요." }
          : !form.anonymous && (form.nickname.trim().length < 2 || form.nickname.trim().length > 40) ? { field: "nickname", message: "닉네임을 2자 이상 40자 이하로 입력해 주세요." }
            : passwordError ? { field: "password", message: passwordError }
              : !form.body.trim() ? { field: "body", message: "질문 내용을 입력해 주세요." }
                : null;

    if (invalid) {
      setFieldErrors({ [invalid.field]: invalid.message });
      const fieldRefs: Record<VisitorField, React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>> = {
        title: titleInputRef,
        body: bodyInputRef,
        nickname: nicknameInputRef,
        password: passwordInputRef,
        category: categoryInputRef,
      };
      const input = fieldRefs[invalid.field].current;
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setFieldErrors({});
    if (!turnstileTokenRef.current) {
      pendingTurnstileSubmitRef.current = true;
      setTurnstileVisible(true);
      setTurnstilePrompt("사람인지 확인을 완료한 뒤 다시 등록해 주세요.");
      requestAnimationFrame(() => widgetRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setSubmitting(true);
    try {
      await call<{ id: string }>("/questions", { method: "POST", body: JSON.stringify(buildVisitorQuestionCreatePayload(form, turnstileTokenRef.current)) }, 201);
      setForm({ title: "", category: "", website: "", anonymous: true, nickname: "", password: "", body: "", serviceIds: [] });
      setFieldErrors({});
      setSubmitError("");
      setComposerOpen(false);
      setTurnstileVisible(false);
      setTurnstileToken("");
      setTurnstilePrompt("");
      window.location.replace("/knowledge/");
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "저장하지 못했습니다.");
    } finally {
      resetToken();
      setSubmitting(false);
    }
  };

  const updateCreateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    if (turnstileTokenRef.current) resetToken();
    setForm((current) => ({ ...current, [field]: value }));
    if (field in fieldErrors) setFieldErrors((current) => { const next = { ...current }; delete next[field as VisitorField]; return next; });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    setSearchInput(nextQuery);
    setQuery(nextQuery);
    queryRef.current = nextQuery;
    setSelected(null);
    setEditSession(null);
    setNotice("");
    void loadList(1, nextQuery, categoryRef.current);
  };
  const clearSearch = () => {
    setSearchInput("");
    setQuery("");
    queryRef.current = "";
    setSelected(null);
    setEditSession(null);
    setNotice("");
    void loadList(1, "", categoryRef.current);
  };
  const changeCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    categoryRef.current = nextCategory;
    setSelected(null);
    setEditSession(null);
    setNotice("");
    void loadList(1, queryRef.current, nextCategory);
  };

  const selectedServices = useMemo(() => selected?.relatedServices || [], [selected]);
  const renderQuestionDetail = (className: string, testId: string) => selected ? <div className={`${styles.detail} ${className}`} data-testid={testId} role="region" aria-label={`질문 상세: ${selected.title}`}>
    <div className={styles.detailHead}><div><p className={styles.eyebrow}>{selected.isAnonymous ? "익명" : selected.nickname}</p><h2>{selected.title}</h2><time>{date(selected.createdAt)}</time>{selected.category ? <p>{selected.category}</p> : null}</div>{!selected.answer ? <><span className={styles.editable}>답변 전 수정 가능</span><button type="button" onClick={() => startEdit(selected.id)}>질문 수정</button></> : <span className={styles.locked}>공식답변 후 수정 잠금</span>}</div>
    <p className={styles.body}>{selected.body}</p><div className={styles.services}>{selectedServices.map((service) => <a key={service.id} href={`/calculators/${service.slug}/`}>{service.name}</a>)}</div>
    <section className={styles.answer}><h3>계산박스 공식답변</h3>{selected.answer ? <p className={styles.body}>{selected.answer.body}</p> : <p>아직 공식답변이 없습니다. 답변 대기 중입니다.</p>}</section>
    {editSession?.questionId === selected.id && !selected.answer && ((editSession.placement === "inline" && testId === "inline-question-detail") || (editSession.placement === "desktop" && testId === "desktop-question-detail")) ? <KnowledgeQuestionEditor key={editSession.questionId} question={selected} sitekey={TURNSTILE_SITEKEY} call={call} onCancel={() => setEditSession(null)} onSaved={async () => { const id = editSession.questionId; if (selected.id !== id) return; setEditSession(null); if (await openQuestion(id, true)) { await loadList(page); setNotice("질문이 수정되었습니다."); } }} onDeleted={async (id) => { if (selected.id !== id || editSession.questionId !== id) return; setSelected(null); setEditSession(null); await loadList(page); setNotice("질문을 삭제했습니다."); }} /> : null}
  </div> : null;
  if (!apiBase) return <section className={styles.shell}><p className={styles.error}>Preview에서만 제공되는 지식센터입니다.</p></section>;
  return <main className={styles.shell} aria-labelledby="knowledge-title">
    <header className={styles.header}><p className={styles.eyebrow}>Knowledge center</p><h1 id="knowledge-title">계산박스 지식센터</h1><p>궁금한 내용을 남기면 계산박스가 공식 답변을 안내합니다.</p></header>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
    {error ? <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); void loadList(page); }}>다시 시도</button></div> : null}
    <div className={styles.listHeading} ref={listTopRef}><h2>최신 질문</h2><span>{query ? `검색 결과 ${total}건` : category ? `${category} 질문 ${total}건` : `전체 ${total}건`}</span></div>
    <div className={styles.searchTools} data-testid="knowledge-search-tools">
        <form className={styles.searchForm} role="search" onSubmit={submitSearch}><label className={styles.searchLabel}><span className={styles.visuallyHidden}>질문 제목이나 내용 검색</span><input type="search" value={searchInput} maxLength={50} placeholder="질문 제목이나 내용 검색" onChange={(event) => setSearchInput(event.target.value)} /></label><button className={styles.searchButton} type="submit">검색</button>{query ? <button className={styles.clearButton} type="button" onClick={clearSearch}>검색어 지우기</button> : null}</form>
        <label className={styles.categoryFilter}><span>카테고리</span><select aria-label="카테고리 필터" value={category} onChange={(event) => changeCategory(event.target.value)}><option value="">전체 카테고리</option>{KNOWLEDGE_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>
    <section className={styles.composer} aria-labelledby="ask-title" data-testid="question-registration">
      <div className={styles.composerHeading}><h2 id="ask-title">질문 등록</h2><button className={styles.composerToggle} type="button" aria-expanded={composerOpen} aria-controls="visitor-question-form" onClick={toggleComposer}>{composerOpen ? "질문 작성 접기" : "질문 작성하기"}</button></div>
      {composerMounted ? <>
        {submitError ? <div className={styles.submitError} role="alert"><p>{submitError}</p><p>입력 내용은 유지됩니다. 오류를 확인하고 다시 시도해 주세요.</p></div> : null}
        <form id="visitor-question-form" ref={createFormRef} data-testid="question-create-form" hidden={!composerOpen} noValidate onSubmit={submit}>
          <label className={styles.honeypot} aria-hidden="true">웹사이트<input name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={512} value={form.website} onChange={(event) => updateCreateField("website", event.target.value)} /></label>
          <div className={styles.formField}><label htmlFor="visitor-question-category">카테고리</label><select id="visitor-question-category" ref={categoryInputRef} aria-invalid={Boolean(fieldErrors.category)} aria-describedby={fieldErrors.category ? "visitor-question-category-error" : undefined} value={form.category} onChange={(event) => updateCreateField("category", event.target.value)} required><option value="">카테고리 선택</option>{KNOWLEDGE_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}</select>{fieldErrors.category ? <small id="visitor-question-category-error" className={styles.fieldError} role="alert">{fieldErrors.category}</small> : null}</div>
          <div className={styles.formField}><label htmlFor="visitor-question-title">제목</label><input id="visitor-question-title" ref={titleInputRef} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "visitor-question-title-error" : undefined} value={form.title} maxLength={120} onChange={(event) => updateCreateField("title", event.target.value)} required />{fieldErrors.title ? <small id="visitor-question-title-error" className={styles.fieldError} role="alert">{fieldErrors.title}</small> : null}</div>
          <label className={styles.check}><input type="checkbox" checked={form.anonymous} onChange={(event) => updateCreateField("anonymous", event.target.checked)} /> 익명으로 등록</label>
          {!form.anonymous ? <div className={styles.formField}><label htmlFor="visitor-question-nickname">닉네임</label><input id="visitor-question-nickname" ref={nicknameInputRef} aria-invalid={Boolean(fieldErrors.nickname)} aria-describedby={fieldErrors.nickname ? "visitor-question-nickname-error" : undefined} value={form.nickname} onChange={(event) => updateCreateField("nickname", event.target.value)} required />{fieldErrors.nickname ? <small id="visitor-question-nickname-error" className={styles.fieldError} role="alert">{fieldErrors.nickname}</small> : null}</div> : null}
          <div className={styles.formField}><label htmlFor="visitor-question-password">비밀번호</label><input id="visitor-question-password" ref={passwordInputRef} type="password" autoComplete="new-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "visitor-question-password-error" : "visitor-password-hint"} value={form.password} onChange={(event) => updateCreateField("password", event.target.value)} minLength={6} maxLength={128} required />{fieldErrors.password ? <small id="visitor-question-password-error" className={styles.fieldError} role="alert">{fieldErrors.password}</small> : null}<small id="visitor-password-hint">6자 이상으로 입력해 주세요. 연속되거나 같은 문자 반복은 사용할 수 없습니다.</small></div>
          <div className={styles.formField}><label htmlFor="visitor-question-body">질문 내용</label><textarea id="visitor-question-body" ref={bodyInputRef} aria-invalid={Boolean(fieldErrors.body)} aria-describedby={fieldErrors.body ? "visitor-question-body-error" : undefined} value={form.body} maxLength={4000} onChange={(event) => updateCreateField("body", event.target.value)} required />{fieldErrors.body ? <small id="visitor-question-body-error" className={styles.fieldError} role="alert">{fieldErrors.body}</small> : null}</div>
          <fieldset><legend>관련 계산기</legend><div className={styles.services}>{services.map((service) => <label className={styles.check} key={service.id}><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={() => toggleService(service.id)} />{service.name}</label>)}</div></fieldset>
          {turnstileVisible ? <><div ref={widgetRef} className={styles.turnstile} /><small role="status">{turnstilePrompt}</small></> : null}<button className={styles.primary} type="submit" disabled={submitting}>{submitting ? "등록 중..." : "질문 등록"}</button>
        </form>
      </> : null}
    </section>
    <section className={styles.layout}>
      <div className={styles.questionColumn}>
        {loading ? <p role="status">질문을 불러오는 중입니다.</p> : null}
        <div className={styles.list} data-testid="knowledge-question-list">{!loading && !items.length ? <p className={styles.empty}>{query ? "검색 결과가 없습니다." : category ? "선택한 카테고리에 공개된 질문이 없습니다." : "등록된 질문이 없습니다."}</p> : null}{items.map((item) => <div className={styles.questionItem} key={item.id}><button className={`${styles.row} ${selected?.id === item.id ? styles.selected : ""}`} type="button" aria-expanded={selected?.id === item.id} onClick={() => toggleQuestion(item.id)}><strong>{item.title}</strong><span>{item.category ? `${item.category} · ` : ""}{item.isAnonymous ? "익명" : item.nickname} · {date(item.createdAt)} · {item.answer ? "답변 완료" : "답변 대기"}</span></button>{selected?.id === item.id ? renderQuestionDetail(styles.mobileQuestionDetail, "inline-question-detail") : null}<a className={styles.detailLink} href={knowledgeDetailPath(item.id)}>질문 상세</a></div>)}</div>
        {totalPages > 1 ? <><nav className={styles.pagination} aria-label="질문 페이지 번호" data-testid="desktop-pagination"><button type="button" disabled={page === 1} onClick={() => void loadList(page - 1)}>이전</button>{pageWindow(page, totalPages).map((entry) => typeof entry === "number" ? <button type="button" key={entry} aria-current={entry === page ? "page" : undefined} aria-label={`${entry}페이지`} className={entry === page ? styles.current : ""} onClick={() => void loadList(entry)}>{entry}</button> : <span aria-hidden="true" key={entry}>…</span>)}<button type="button" disabled={page === totalPages} onClick={() => void loadList(page + 1)}>다음</button></nav><nav className={styles.mobilePagination} aria-label="질문 페이지 이동" data-testid="mobile-pagination"><button type="button" disabled={page === 1} onClick={() => void loadList(page - 1)}>이전</button><span aria-live="polite">{page} / {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => void loadList(page + 1)}>다음</button></nav></> : null}
      </div>
      {selected ? renderQuestionDetail(styles.desktopDetail, "desktop-question-detail") : <div className={`${styles.detail} ${styles.desktopDetail}`}><p className={styles.empty}>질문을 선택하면 상세 내용을 확인할 수 있습니다.</p></div>}
    </section>
  </main>;
}

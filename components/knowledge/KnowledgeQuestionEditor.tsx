"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./KnowledgeCenter.module.css";

type EditableQuestion = { id: string; title: string; body: string; isAnonymous: boolean; nickname: string | null };
type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => unknown; reset: (id?: unknown) => void; remove?: (id: unknown) => void };

export function KnowledgeQuestionEditor({ question, sitekey, call, onSaved, onCancel }: {
  question: EditableQuestion;
  sitekey: string;
  call: <T>(path: string, init?: RequestInit) => Promise<T>;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", nickname: "" });
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<unknown>(null);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    const w = window as Window & { turnstile?: Turnstile };
    const mount = () => {
      if (!active.current || !widgetRef.current || !w.turnstile || widgetId.current !== null) return;
      widgetId.current = w.turnstile.render(widgetRef.current, { sitekey, language: "ko", callback: setToken, "expired-callback": () => setToken(""), "error-callback": () => setToken("") });
    };
    const script = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]');
    if (w.turnstile) mount();
    else script?.addEventListener("load", mount);
    return () => {
      active.current = false;
      script?.removeEventListener("load", mount);
      if (widgetId.current !== null) w.turnstile?.remove?.(widgetId.current);
      widgetId.current = null;
    };
  }, [sitekey]);

  const resetToken = () => {
    (window as Window & { turnstile?: Turnstile }).turnstile?.reset(widgetId.current ?? undefined);
    setToken("");
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (!token) throw new Error("사람인지 확인을 완료해 주세요.");
      if (!authenticated) {
        const result = await call<{ verified: boolean }>(`/questions/${question.id}/verify-password`, { method: "POST", body: JSON.stringify({ password, turnstile_token: token }) });
        if (!result.verified) throw new Error("비밀번호가 일치하지 않습니다.");
        if (!active.current) return;
        setForm({ title: question.title, body: question.body, nickname: question.nickname || "" });
        setAuthenticated(true);
      } else {
        // The current password is checked again on PATCH; it is never a replacement password.
        await call(`/questions/${question.id}`, { method: "PATCH", body: JSON.stringify({ ...form, password, turnstile_token: token }) });
        if (active.current) await onSaved();
      }
    } catch (cause) {
      if (active.current) setError(cause instanceof Error ? cause.message : "질문을 수정하지 못했습니다.");
    } finally {
      if (active.current) { resetToken(); setBusy(false); }
    }
  };

  return <section className={styles.inlineEditor} aria-label={authenticated ? "질문 수정폼" : "비밀번호 확인"} data-testid="question-editor">
    <h3>{authenticated ? "질문 수정" : "비밀번호 확인"}</h3>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <form onSubmit={submit}>
      {!authenticated ? <label>현재 비밀번호<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} minLength={4} maxLength={128} required /></label> : <>
        <label>수정 제목<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} maxLength={120} required /></label>
        {!question.isAnonymous ? <label>수정 닉네임<input value={form.nickname} onChange={event => setForm({ ...form, nickname: event.target.value })} minLength={2} maxLength={40} required /></label> : null}
        <label>수정 질문 내용<textarea value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} maxLength={4000} required /></label>
      </>}
      <div ref={widgetRef} className={styles.turnstile} />
      <div className={styles.editorActions}><button className={styles.primary} type="submit" disabled={busy}>{busy ? "확인 중..." : authenticated ? "수정 저장" : "비밀번호 확인"}</button><button type="button" onClick={onCancel} disabled={busy}>취소</button></div>
    </form>
  </section>;
}

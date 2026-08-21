"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import {
  calculateRequiredGrossAmountFromUnknown,
  calculateWithholdingTaxFromUnknown,
  WITHHOLDING_TAX_LIMITS,
  type WithholdingTaxResult,
} from "@/lib/calculators/withholding-tax";
import styles from "./WithholdingTaxCalculator.module.css";

type Direction = "gross-to-net" | "net-to-gross";

const wonFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const formatWon = (value: number) => `${wonFormatter.format(value)}원`;

function formatAmountInput(value: string): string {
  const digits = value.replaceAll(",", "");
  return /^\d+$/.test(digits) ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : value;
}

export function WithholdingTaxCalculator() {
  const [direction, setDirection] = useState<Direction>("gross-to-net");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<WithholdingTaxResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isGrossToNet = direction === "gross-to-net";
  const inputLabel = isGrossToNet ? "세전 지급액" : "원하는 실수령액";

  function handleDirectionChange(nextDirection: Direction) {
    setDirection(nextDirection);
    setAmount("");
    setResult(null);
    setError(null);
    setIsStale(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setAmount(formatAmountInput(event.currentTarget.value));
    setError(null);
    if (result) setIsStale(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = amount.trim() === "" ? undefined : Number(amount.replaceAll(",", ""));
    const response = isGrossToNet
      ? calculateWithholdingTaxFromUnknown(value)
      : calculateRequiredGrossAmountFromUnknown(value);

    if (!response.success) {
      setError(response.error.message);
      setResult(null);
      setIsStale(false);
      inputRef.current?.focus();
      return;
    }

    setResult(response.data);
    setError(null);
    setIsStale(false);
  }

  function handleReset() {
    setAmount("");
    setResult(null);
    setError(null);
    setIsStale(false);
    inputRef.current?.focus();
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <p className={styles.step}>01 · 계산 방향</p>
        <h2>세전 금액과 실수령액을 양방향으로 계산하세요</h2>
        <div className={styles.directionButtons} role="group" aria-label="계산 방향">
          <button type="button" aria-pressed={isGrossToNet} className={isGrossToNet ? styles.active : ""} onClick={() => handleDirectionChange("gross-to-net")}>세전 → 실수령액</button>
          <button type="button" aria-pressed={!isGrossToNet} className={!isGrossToNet ? styles.active : ""} onClick={() => handleDirectionChange("net-to-gross")}>실수령액 → 세전</button>
        </div>
        <label htmlFor="withholding-tax-amount">{inputLabel}</label>
        <div className={`${styles.inputShell} ${error ? styles.inputError : ""}`}>
          <input ref={inputRef} id="withholding-tax-amount" name="amount" type="text" inputMode="numeric" autoComplete="off" value={amount} onChange={handleChange} aria-invalid={Boolean(error)} aria-describedby={error ? "withholding-tax-error" : "withholding-tax-help"} />
          <span>원</span>
        </div>
        <p id="withholding-tax-help" className={styles.help}>원 단위 정수로 입력하세요. 최대 {formatWon(WITHHOLDING_TAX_LIMITS.maximumAmount)}까지 계산합니다.</p>
        {error && <p id="withholding-tax-error" className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">계산하기</button>
          <button className={styles.resetButton} type="button" onClick={handleReset}>초기화</button>
        </div>
      </form>

      <section className={`${styles.resultCard} ${isStale ? styles.stale : ""}`} aria-live="polite" aria-labelledby="withholding-tax-result-title">
        {!result ? <div className={styles.empty}><span aria-hidden="true">₩</span><h2 id="withholding-tax-result-title">예상 원천징수액을 확인해 보세요</h2><p>계산 방향을 고르고 금액을 입력하면 소득세와 개인지방소득세를 나누어 보여드립니다.</p></div> : <>
          {isStale && <p className={styles.staleNotice}>입력값이 변경되었습니다. 다시 계산해 최신 결과를 확인해 주세요.</p>}
          <div className={styles.primaryResult}>
            <p className={styles.step}>02 · 예상 결과</p>
            <h2 id="withholding-tax-result-title">{isGrossToNet ? "예상 실수령액" : "필요한 세전 지급액"}</h2>
            <strong>{formatWon(isGrossToNet ? result.netAmount : result.grossAmount)}</strong>
            {!isGrossToNet && <p>3.3% 역산 기준부터 끝수 처리까지 다시 계산한 금액</p>}
          </div>
          <dl className={styles.resultList}>
            <div><dt>세전 지급액</dt><dd>{formatWon(result.grossAmount)}</dd></div>
            <div><dt>소득세 3%</dt><dd>{formatWon(result.incomeTax)}</dd></div>
            <div><dt>개인지방소득세</dt><dd>{formatWon(result.localIncomeTax)}</dd></div>
            <div className={styles.total}><dt>예상 원천징수액</dt><dd>{formatWon(result.totalWithholdingTax)}</dd></div>
            <div><dt>예상 실수령액</dt><dd>{formatWon(result.netAmount)}</dd></div>
          </dl>
          <p className={styles.note}>일반적인 국내 거주자 인적용역 사업소득의 입력값 기준 예상값입니다.</p>
        </>}
      </section>
    </div>
  );
}

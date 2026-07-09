"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { calculateWorkChildIncentive } from "@/lib/calculators/work-child-incentive";
import type {
  WorkChildIncentiveInputField,
  WorkChildIncentiveResult,
  WorkChildIncentiveValidationError,
} from "@/lib/calculators/work-child-incentive/types";
import {
  buildWorkChildIncentiveResultText,
  formatNumericInput,
  formatWon,
  initialWorkChildIncentiveInputs,
  parseWorkChildIncentiveInputs,
  parseWorkChildIncentiveStoredInputs,
  serializeWorkChildIncentiveInputs,
  WORK_CHILD_INCENTIVE_STORAGE_KEY,
  type WorkChildIncentiveRawInputs,
} from "./workChildIncentiveClientUtils";
import { workChildIncentivePolicySummary } from "./workChildIncentiveContentData";
import styles from "./WorkChildIncentiveCalculator.module.css";

const amountFields: WorkChildIncentiveInputField[] = [
  "totalIncome",
  "totalSalary",
  "propertyAmount",
  "spouseSalary",
];

const fieldLabels: Partial<Record<WorkChildIncentiveInputField, string>> = {
  totalIncome: "부부합산 총소득",
  totalSalary: "총급여액 등",
  propertyAmount: "재산 합계액",
  childCount: "부양자녀 수",
  spouseSalary: "배우자 총급여액 등",
};

async function copyWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to document fallback.
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return typeof document.execCommand === "function"
      ? document.execCommand("copy")
      : false;
  } catch {
    return false;
  } finally {
    textarea.remove();
    activeElement?.focus();
  }
}

function getFieldErrors(
  errors: WorkChildIncentiveValidationError[],
  field: WorkChildIncentiveInputField,
) {
  return errors.filter((error) => error.field === field);
}

function ResultAmount({ value }: { value: number }) {
  return <>{formatWon(value)}</>;
}

export function WorkChildIncentiveCalculator() {
  const [input, setInput] = useState<WorkChildIncentiveRawInputs>(
    initialWorkChildIncentiveInputs,
  );
  const [errors, setErrors] = useState<WorkChildIncentiveValidationError[]>([]);
  const [result, setResult] = useState<WorkChildIncentiveResult | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const stored = window.localStorage.getItem(WORK_CHILD_INCENTIVE_STORAGE_KEY);

        if (stored) {
          const restored = parseWorkChildIncentiveStoredInputs(stored);

          if (restored) {
            setInput(restored);
          } else {
            window.localStorage.removeItem(WORK_CHILD_INCENTIVE_STORAGE_KEY);
          }
        }
      } catch {
        // Storage is optional.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  function persist(nextInput: WorkChildIncentiveRawInputs) {
    if (!hasRestoredInputs.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        WORK_CHILD_INCENTIVE_STORAGE_KEY,
        serializeWorkChildIncentiveInputs(nextInput),
      );
    } catch {
      // Calculation remains available without storage.
    }
  }

  function updateInput(field: WorkChildIncentiveInputField, value: string) {
    const nextInput = { ...input, [field]: value };
    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as WorkChildIncentiveInputField;
    const rawValue = event.currentTarget.value;
    const value = amountFields.includes(field) || field === "childCount"
      ? formatNumericInput(rawValue)
      : rawValue;

    updateInput(field, value);
  }

  function handleOptionChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    updateInput(event.currentTarget.name as WorkChildIncentiveInputField, event.currentTarget.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    const response = calculateWorkChildIncentive(parseWorkChildIncentiveInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setIsResultStale(false);
      firstInputRef.current?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setIsResultStale(false);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(WORK_CHILD_INCENTIVE_STORAGE_KEY);
    } catch {
      // Reset continues without storage access.
    }

    setInput(initialWorkChildIncentiveInputs);
    setErrors([]);
    setResult(null);
    setIsResultStale(false);
    setActionMessage("");
    firstInputRef.current?.focus();
  }

  async function handleCopy() {
    if (!result || isResultStale) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    const copied = await copyWithFallback(buildWorkChildIncentiveResultText(result));
    setActionMessage(
      copied
        ? "계산 결과를 복사했습니다."
        : "결과를 복사하지 못했습니다. 수동으로 선택해 복사해 주세요.",
    );
  }

  async function handleShare() {
    if (!result || isResultStale || typeof navigator.share !== "function") {
      await handleCopy();
      return;
    }

    try {
      const shareData: ShareData = {
        title: "근로·자녀장려금 계산 결과",
        text: buildWorkChildIncentiveResultText(result),
      };

      if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        shareData.url = window.location.href;
      }

      await navigator.share(shareData);
      setActionMessage("계산 결과를 공유했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("");
      } else {
        setActionMessage("공유하지 못했습니다. 결과 복사를 이용해 주세요.");
      }
    }
  }

  const childMismatch =
    (input.applicationType === "child" || input.applicationType === "both") &&
    (input.householdType === "single" || input.childCount === "0");

  return (
    <>
      <aside className={styles.policyNotice} aria-label="계산 기준 안내">
        <strong>기준일 {workChildIncentivePolicySummary.verifiedAt}</strong>
        <span>{workChildIncentivePolicySummary.workIncomeLimits}</span>
        <span>{workChildIncentivePolicySummary.childIncomeLimit}</span>
        <span>예상 계산용이며 실제 심사 결과와 다를 수 있습니다.</span>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 입력</p>
              <h2>신청 조건을 입력하세요</h2>
            </div>
            <p className={styles.muted}>자가진단</p>
          </div>

          <div className={styles.fieldGrid}>
            <fieldset className={styles.radioGroup}>
              <legend>신청 유형</legend>
              <div className={styles.radioGrid}>
                {[
                  ["work", "근로장려금"],
                  ["child", "자녀장려금"],
                  ["both", "근로+자녀장려금"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="applicationType"
                      value={value}
                      checked={input.applicationType === value}
                      onChange={handleOptionChange}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.radioGroup}>
              <legend>가구 유형</legend>
              <div className={styles.radioGrid}>
                {[
                  ["single", "단독"],
                  ["singleIncome", "홑벌이"],
                  ["dualIncome", "맞벌이"],
                ].map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="householdType"
                      value={value}
                      checked={input.householdType === value}
                      onChange={handleOptionChange}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {(["totalIncome", "totalSalary", "propertyAmount", "spouseSalary", "childCount"] as const).map(
              (field, index) => {
                const fieldErrors = getFieldErrors(errors, field);
                return (
                  <div className={styles.field} key={field}>
                    <label htmlFor={field}>{fieldLabels[field]}</label>
                    <div className={`${styles.inputShell} ${fieldErrors.length > 0 ? styles.inputShellError : ""}`}>
                      <input
                        ref={index === 0 ? firstInputRef : undefined}
                        id={field}
                        name={field}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={input[field]}
                        onChange={handleTextChange}
                        aria-invalid={fieldErrors.length > 0}
                        aria-describedby={`${field}-description ${field}-error`}
                      />
                      <span aria-hidden="true">{field === "childCount" ? "명" : "원"}</span>
                    </div>
                    <p className={styles.fieldDescription} id={`${field}-description`}>
                      {field === "totalIncome" && "2025년 부부합산 연간 총소득을 입력합니다."}
                      {field === "totalSalary" && "근로·사업·종교인 총급여액 등 예상 산정 기준을 입력합니다."}
                      {field === "propertyAmount" && "2025년 6월 1일 현재 가구원 합산 재산입니다. 부채는 차감하지 않습니다."}
                      {field === "spouseSalary" && "맞벌이 판단 안내용입니다. 맞벌이는 배우자 총급여액 등 300만원 이상 기준을 확인합니다."}
                      {field === "childCount" && "18세 미만 부양자녀 수를 정수로 입력합니다."}
                    </p>
                    {fieldErrors.length > 0 && (
                      <p className={styles.fieldError} id={`${field}-error`}>
                        {fieldErrors.map((error) => error.message).join(" ")}
                      </p>
                    )}
                  </div>
                );
              },
            )}

            <label className={styles.field}>
              <span>부양자녀 나이 기준 확인</span>
              <select name="childAgeEligible" value={input.childAgeEligible} onChange={handleOptionChange}>
                <option value="false">18세 미만 기준 확인 필요</option>
                <option value="true">18세 미만 기준 충족</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>신청 구분</span>
              <select name="filingType" value={input.filingType} onChange={handleOptionChange}>
                <option value="regular">정기</option>
                <option value="late">기한 후</option>
                <option value="halfYear">반기 안내용</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>체납 충당 안내</span>
              <select name="hasTaxArrears" value={input.hasTaxArrears} onChange={handleOptionChange}>
                <option value="no">체납액 없음</option>
                <option value="yes">체납액 있음</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>자녀세액공제 중복 안내</span>
              <select name="hasChildTaxCredit" value={input.hasChildTaxCredit} onChange={handleOptionChange}>
                <option value="no">중복 해당 없음</option>
                <option value="yes">중복 가능성 있음</option>
              </select>
            </label>
          </div>

          {childMismatch && (
            <p className={styles.notice}>
              단독가구 또는 부양자녀 0명 조건에서는 자녀장려금 예상액이 제외될 수 있습니다.
            </p>
          )}

          {errors.length > 0 && (
            <p className={styles.errorSummary} role="alert">
              입력값을 확인해 주세요.
            </p>
          )}

          <div className={styles.actions}>
            <button className={styles.primaryButton} type="submit">
              예상액 계산
            </button>
            <button className={styles.secondaryButton} type="button" onClick={handleReset}>
              다시 계산
            </button>
          </div>
        </form>

        <section className={styles.resultCard} aria-labelledby="work-child-result-heading">
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 결과</p>
              <h2 id="work-child-result-heading">예상 결과</h2>
            </div>
            <p className={styles.muted}>심사 결과 아님</p>
          </div>

          {!result && (
            <div className={styles.emptyResult} aria-live="polite">
              <p>조건을 입력하면 신청 가능성과 예상 구간을 표시합니다.</p>
            </div>
          )}

          {result && (
            <div aria-live="polite">
              {isResultStale && (
                <p className={styles.staleNotice}>입력값이 변경되었습니다. 다시 계산해 주세요.</p>
              )}

              <div className={styles.primaryResult}>
                <p>최종 예상 수령액</p>
                <strong><ResultAmount value={result.totalEstimatedAmount} /></strong>
                <span>{result.interpretation}</span>
              </div>

              <dl className={styles.summaryGrid}>
                <div>
                  <dt>근로장려금 신청 가능성</dt>
                  <dd>{result.work.reason}</dd>
                </div>
                <div>
                  <dt>자녀장려금 신청 가능성</dt>
                  <dd>{result.child.reason}</dd>
                </div>
                <div>
                  <dt>재산 기준</dt>
                  <dd>{result.propertyMessage}</dd>
                </div>
                <div>
                  <dt>감액 사유</dt>
                  <dd>{result.reductionReasons.length > 0 ? result.reductionReasons.join(", ") : "추가 안내 없음"}</dd>
                </div>
              </dl>

              <div className={styles.detailSection}>
                <h3>상세 계산</h3>
                <dl className={styles.detailGrid}>
                  <div>
                    <dt>근로장려금 예상액</dt>
                    <dd><ResultAmount value={result.work.estimatedAfterReduction} /></dd>
                  </div>
                  <div>
                    <dt>근로장려금 예상 구간</dt>
                    <dd>
                      <ResultAmount value={result.work.estimatedRange.min} />~<ResultAmount value={result.work.estimatedRange.max} />
                    </dd>
                  </div>
                  <div>
                    <dt>자녀장려금 예상액</dt>
                    <dd><ResultAmount value={result.child.estimatedAfterReduction} /></dd>
                  </div>
                  <div>
                    <dt>자녀장려금 예상 구간</dt>
                    <dd>
                      <ResultAmount value={result.child.estimatedRange.min} />~<ResultAmount value={result.child.estimatedRange.max} />
                    </dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailSection}>
                <h3>결과 해석</h3>
                <ul className={styles.reasonList}>
                  <li>국세청 실제 심사에서 가구, 소득, 재산 자료가 다시 확인됩니다.</li>
                  {result.reductionReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                  {result.child.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <p className={styles.notice}>
                예상 계산용이며 실제 지급 여부와 지급액은 국세청 심사 결과에 따라 달라질 수 있습니다.
              </p>

              <div className={styles.resultActions}>
                <button className={styles.secondaryButton} type="button" onClick={handleCopy}>
                  결과 복사
                </button>
                <button className={styles.secondaryButton} type="button" onClick={handleShare}>
                  {isShareSupported ? "공유" : "복사로 공유"}
                </button>
              </div>
              <p className={styles.actionMessage} aria-live="polite">
                {actionMessage}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

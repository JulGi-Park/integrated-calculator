"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  calculateDsr,
  type DsrCalculationResult,
  type DsrInput,
  type DsrInputField,
  type DsrValidationError,
} from "@/lib/calculators/dsr";
import {
  buildDsrResultText,
  DSR_STORAGE_KEY,
  formatNumericInput,
  formatRate,
  formatWon,
  initialDsrInputs,
  parseDsrInputs,
  parseDsrStoredInputs,
  serializeDsrInputs,
  type DsrRawInputs,
} from "./dsrClientUtils";
import styles from "./DsrCalculator.module.css";

const repaymentOptions: Array<{
  value: DsrInput["repaymentType"];
  label: string;
  description: string;
}> = [
  {
    value: "levelPayment",
    label: "원리금균등",
    description: "월 상환액 일정",
  },
  {
    value: "equalPrincipal",
    label: "원금균등",
    description: "첫 달과 평균 구분",
  },
  {
    value: "bullet",
    label: "만기일시",
    description: "DSR은 연간 이자 중심",
  },
];

const inputFields: Array<{
  name: Exclude<DsrInputField, "repaymentType">;
  label: string;
  unit: string;
  inputMode: "numeric" | "decimal";
  description: string;
  isAmount?: boolean;
}> = [
  {
    name: "annualIncome",
    label: "연소득",
    unit: "원",
    inputMode: "numeric",
    description: "소득 인정 방식은 금융기관 심사 기준과 다를 수 있습니다.",
    isAmount: true,
  },
  {
    name: "existingAnnualDebtPayment",
    label: "기존 대출 연간 원리금",
    unit: "원",
    inputMode: "numeric",
    description: "기존 대출의 1년 원리금 상환액을 입력합니다. 없으면 0원입니다.",
    isAmount: true,
  },
  {
    name: "newLoanPrincipal",
    label: "신규 대출 금액",
    unit: "원",
    inputMode: "numeric",
    description: "새로 받을 대출 원금을 입력합니다.",
    isAmount: true,
  },
  {
    name: "annualInterestRate",
    label: "신규 대출 연 금리",
    unit: "%",
    inputMode: "decimal",
    description: "0% 이상 입력할 수 있습니다.",
  },
  {
    name: "termMonths",
    label: "신규 대출 기간",
    unit: "개월",
    inputMode: "numeric",
    description: "정수 개월로 입력합니다. 30년은 360개월입니다.",
  },
  {
    name: "stressInterestRate",
    label: "스트레스 금리",
    unit: "%p",
    inputMode: "decimal",
    description: "비교 계산에서 신규 대출 금리에 더합니다.",
  },
  {
    name: "dsrLimitRate",
    label: "DSR 기준 비율",
    unit: "%",
    inputMode: "decimal",
    description: "예: 40, 50, 60 등 직접 입력할 수 있습니다.",
  },
];

function getFieldErrors(
  errors: DsrValidationError[],
  field: DsrInputField,
) {
  return errors.filter((error) => error.field === field);
}

async function copyWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to document fallback.
  }

  const textarea = document.createElement("textarea");
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
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

export function DsrCalculator() {
  const [input, setInput] = useState<DsrRawInputs>(initialDsrInputs);
  const [errors, setErrors] = useState<DsrValidationError[]>([]);
  const [result, setResult] = useState<DsrCalculationResult | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const annualIncomeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(DSR_STORAGE_KEY);

        if (storedValue) {
          const restoredInput = parseDsrStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
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

  function persist(nextInput: DsrRawInputs) {
    if (!hasRestoredInputs.current) {
      return;
    }

    try {
      window.localStorage.setItem(DSR_STORAGE_KEY, serializeDsrInputs(nextInput));
    } catch {
      // Calculation remains available without storage.
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof DsrRawInputs;
    const rawValue = event.currentTarget.value;
    const config = inputFields.find((item) => item.name === field);
    const value = config?.isAmount ? formatNumericInput(rawValue) : rawValue;
    const nextInput = { ...input, [field]: value };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleRepaymentChange(event: ChangeEvent<HTMLInputElement>) {
    const nextInput = {
      ...input,
      repaymentType: event.currentTarget.value as DsrInput["repaymentType"],
    };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    const response = calculateDsr(parseDsrInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setIsResultStale(false);
      annualIncomeRef.current?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setIsResultStale(false);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(DSR_STORAGE_KEY);
    } catch {
      // Reset continues without storage access.
    }

    setInput(initialDsrInputs);
    setErrors([]);
    setResult(null);
    setIsResultStale(false);
    setActionMessage("");
    annualIncomeRef.current?.focus();
  }

  async function handleCopy() {
    if (!result || isResultStale) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    const copied = await copyWithFallback(buildDsrResultText(result));
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
        title: "DSR 계산 결과",
        text: buildDsrResultText(result),
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

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 입력</p>
            <h2>소득과 대출 조건을 입력하세요</h2>
          </div>
          <p className={styles.muted}>예상 계산용</p>
        </div>

        <div className={styles.fieldGrid}>
          {inputFields.map(({ name, label, unit, inputMode, description }, index) => {
            const fieldErrors = getFieldErrors(errors, name);
            const describedBy = `${name}-description${
              fieldErrors.length > 0 ? ` ${name}-error` : ""
            }`;

            return (
              <div className={styles.field} key={name}>
                <label htmlFor={name}>{label}</label>
                <div
                  className={`${styles.inputShell} ${
                    fieldErrors.length > 0 ? styles.inputShellError : ""
                  }`}
                >
                  <input
                    ref={index === 0 ? annualIncomeRef : undefined}
                    id={name}
                    name={name}
                    type="text"
                    inputMode={inputMode}
                    autoComplete="off"
                    value={input[name]}
                    onChange={handleInputChange}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={describedBy}
                  />
                  <span aria-hidden="true">{unit}</span>
                </div>
                <p className={styles.fieldDescription} id={`${name}-description`}>
                  {description}
                </p>
                {fieldErrors.length > 0 && (
                  <p className={styles.fieldError} id={`${name}-error`}>
                    {fieldErrors.map((error) => error.message).join(" ")}
                  </p>
                )}
              </div>
            );
          })}

          <fieldset className={styles.radioGroup}>
            <legend>상환 방식</legend>
            <div className={styles.radioGrid}>
              {repaymentOptions.map((option) => (
                <label className={styles.radioCard} key={option.value}>
                  <input
                    type="radio"
                    name="repaymentType"
                    value={option.value}
                    checked={input.repaymentType === option.value}
                    onChange={handleRepaymentChange}
                  />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {errors.length > 0 && (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryButton} type="submit">
            DSR 계산
          </button>
          <button className={styles.secondaryButton} type="button" onClick={handleReset}>
            다시 계산
          </button>
        </div>
      </form>

      <section className={styles.resultCard} aria-labelledby="dsr-result-heading">
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>02 · 결과</p>
            <h2 id="dsr-result-heading">예상 DSR 비율</h2>
          </div>
          <p className={styles.muted}>심사 결과 아님</p>
        </div>

        {!result && (
          <div className={styles.emptyResult} aria-live="polite">
            <p>조건을 입력하면 기준 DSR과 스트레스 DSR을 비교합니다.</p>
          </div>
        )}

        {result && (
          <div aria-live="polite">
            {isResultStale && (
              <p className={styles.staleNotice}>입력값이 변경되었습니다. 다시 계산해 주세요.</p>
            )}
            <p className={styles.summaryValue}>{formatRate(result.base.dsrRate)}</p>
            <p className={styles.muted}>{result.base.interpretation}</p>

            <div className={styles.comparisonGrid}>
              <article>
                <h3>기준 금리</h3>
                <p>{formatRate(result.base.dsrRate)}</p>
                <p>{formatWon(result.base.totalAnnualDebtPayment)} / 년</p>
              </article>
              <article>
                <h3>스트레스 금리 반영</h3>
                <p>{formatRate(result.stressed.dsrRate)}</p>
                <p>{formatWon(result.stressed.totalAnnualDebtPayment)} / 년</p>
              </article>
            </div>

            <dl className={styles.summaryGrid}>
              <div>
                <dt>기존 대출 연간 원리금</dt>
                <dd>{formatWon(result.input.existingAnnualDebtPayment)}</dd>
              </div>
              <div>
                <dt>신규 대출 연간 원리금</dt>
                <dd>{formatWon(result.base.newLoanPayment.annualPaymentForDsr)}</dd>
              </div>
              <div>
                <dt>신규 대출 월 상환액</dt>
                <dd>{formatWon(result.base.newLoanPayment.monthlyPayment)}</dd>
              </div>
              <div>
                <dt>DSR 기준 대비</dt>
                <dd>
                  {result.base.remainingDsrRateRoom >= 0 ? "여유 " : "초과 "}
                  {formatRate(Math.abs(result.base.remainingDsrRateRoom))}
                </dd>
              </div>
            </dl>

            <dl className={styles.detailGrid}>
              <div>
                <dt>원금균등 첫 달 월 상환액</dt>
                <dd>{formatWon(result.base.newLoanPayment.firstMonthlyPayment)}</dd>
              </div>
              <div>
                <dt>원금균등 평균 월 상환액</dt>
                <dd>{formatWon(result.base.newLoanPayment.averageMonthlyPayment)}</dd>
              </div>
              <div>
                <dt>만기 원금 별도 확인</dt>
                <dd>{formatWon(result.base.newLoanPayment.maturityPrincipal)}</dd>
              </div>
            </dl>

            <p className={styles.notice}>
              예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다.
              만기일시상환은 만기 원금 상환 부담을 별도로 확인해야 합니다.
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
  );
}

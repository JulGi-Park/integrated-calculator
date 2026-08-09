"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import {
  calculateOvertimePayFromUnknown,
  formatHours,
  formatWon,
  type OvertimePayInput,
  type OvertimePayInputField,
  type OvertimePayResult,
  type OvertimePayValidationError,
} from "@/lib/calculators/overtime-pay";
import {
  buildOvertimePayResultText,
  formatOvertimePayNumberInput,
  initialOvertimePayInputs,
  OVERTIME_PAY_STORAGE_KEY,
  parseOvertimePayStoredInputs,
  serializeOvertimePayInputs,
  type OvertimePayRawInputs,
} from "./overtimePayClientUtils";
import extraStyles from "./OvertimePayCalculator.module.css";
import styles from "./SeveranceCalculator.module.css";

type FieldDefinition = Readonly<{
  name: OvertimePayInputField;
  label: string;
  unit: string;
  required: boolean;
  description: string;
}>;

const fields: FieldDefinition[] = [
  {
    name: "hourlyWage",
    label: "통상시급 또는 기준 시급",
    unit: "원",
    required: true,
    description: "연장·야간·휴일근로수당 계산에 쓰는 통상임금 기준 시급을 입력합니다.",
  },
  {
    name: "baseHours",
    label: "기본근로 시간",
    unit: "시간",
    required: false,
    description: "기본급여까지 함께 보고 싶을 때 입력합니다.",
  },
  {
    name: "overtimeHours",
    label: "연장근로 시간",
    unit: "시간",
    required: true,
    description: "연장근로로 판정된 시간을 입력하면 해당 시간의 지급분을 1.5배로 계산합니다.",
  },
  {
    name: "nightHours",
    label: "야간근로 시간",
    unit: "시간",
    required: true,
    description: "오후 10시~다음 날 오전 6시의 시간입니다. 연장·휴일근로와 겹치면 같은 시간을 함께 입력합니다.",
  },
  {
    name: "holidayHoursWithin8",
    label: "휴일근로 8시간 이내 시간",
    unit: "시간",
    required: true,
    description: "휴일근로 8시간 이내분은 1.5배로 계산합니다.",
  },
  {
    name: "holidayHoursOver8",
    label: "휴일근로 8시간 초과 시간",
    unit: "시간",
    required: true,
    description: "휴일근로 8시간 초과분은 2.0배로 계산합니다.",
  },
];

const fieldLabels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<OvertimePayInputField, string>;

function parseInputs(input: OvertimePayRawInputs): OvertimePayInput {
  return {
    hourlyWage: input.hourlyWage.trim() === "" ? Number.NaN : Number(input.hourlyWage),
    baseHours: input.baseHours.trim() === "" ? 0 : Number(input.baseHours),
    overtimeHours: input.overtimeHours.trim() === "" ? 0 : Number(input.overtimeHours),
    nightHours: input.nightHours.trim() === "" ? 0 : Number(input.nightHours),
    holidayHoursWithin8:
      input.holidayHoursWithin8.trim() === ""
        ? 0
        : Number(input.holidayHoursWithin8),
    holidayHoursOver8:
      input.holidayHoursOver8.trim() === "" ? 0 : Number(input.holidayHoursOver8),
    rounding: "round",
  };
}

function getErrorMessage(error: OvertimePayValidationError): string {
  if (error.message) {
    return error.message;
  }

  return `${fieldLabels[error.field]} 값을 확인해 주세요.`;
}

async function copyWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea-based copy.
  }

  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
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

export function OvertimePayCalculator() {
  const [input, setInput] = useState<OvertimePayRawInputs>(initialOvertimePayInputs);
  const [errors, setErrors] = useState<OvertimePayValidationError[]>([]);
  const [result, setResult] = useState<OvertimePayResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<OvertimePayInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<Partial<Record<OvertimePayInputField, HTMLInputElement>>>({});

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(OVERTIME_PAY_STORAGE_KEY);
        if (storedValue !== null) {
          const restoredInput = parseOvertimePayStoredInputs(storedValue);
          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(OVERTIME_PAY_STORAGE_KEY);
          }
        }
      } catch {
        // Browser storage is optional.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const errorsByField = errors.reduce<
    Partial<Record<OvertimePayInputField, OvertimePayValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof OvertimePayRawInputs;
    const nextInput = {
      ...input,
      [field]: formatOvertimePayNumberInput(event.currentTarget.value),
    };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }

    if (hasRestoredInputs.current) {
      try {
        window.localStorage.setItem(
          OVERTIME_PAY_STORAGE_KEY,
          serializeOvertimePayInputs(nextInput),
        );
      } catch {
        // Storage failure must not block calculation.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");

    const parsedInput = parseInputs(input);
    const response = calculateOvertimePayFromUnknown(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);

      const firstErrorField = fields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      if (firstErrorField) {
        inputRefs.current[firstErrorField.name]?.focus();
      }
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput);
    setIsResultStale(false);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(OVERTIME_PAY_STORAGE_KEY);
    } catch {
      // Reset continues even when storage is unavailable.
    }

    setInput(initialOvertimePayInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.hourlyWage?.focus();
  }

  function getCurrentResultText(): string | null {
    if (!result || !calculatedInput || isResultStale || errors.length > 0) {
      return null;
    }

    return buildOvertimePayResultText(calculatedInput, result);
  }

  async function handleCopy() {
    const text = getCurrentResultText();

    if (!text) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    const copied = await copyWithFallback(text);
    setActionMessage(
      copied
        ? "계산 결과를 복사했습니다."
        : "결과를 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.",
    );
  }

  async function handleShare() {
    const text = getCurrentResultText();

    if (!text || typeof navigator.share !== "function") {
      setActionMessage("공유를 지원하지 않는 브라우저입니다. 결과 복사를 이용해 주세요.");
      return;
    }

    try {
      await navigator.share({
        title: "연장·야간·휴일근로수당 계산 결과",
        text,
        url:
          window.location.protocol === "http:" ||
          window.location.protocol === "https:"
            ? window.location.href
            : undefined,
      });
      setActionMessage("계산 결과를 공유했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("");
      } else {
        setActionMessage("결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.");
      }
    }
  }

  return (
    <>
      <aside className={styles.policyNotice} aria-label="계산 기준 안내">
        <strong>입력 전 확인</strong>
        <p>
          이 계산기는 상시근로자 5인 이상 사업장의 법정 가산 기준을 참고합니다.
          야간근로 시간은 추가 가산 시간이므로 연장·휴일근로와 겹치면 같은 시간을
          야간근로에도 입력합니다. 5인 미만 사업장은 근로계약·취업규칙을 확인해 주세요.
        </p>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 근로 시간</p>
              <h2>수당 계산 정보를 입력하세요</h2>
            </div>
            <p>원 단위 반올림</p>
          </div>

          <label className={extraStyles.checkNotice}>
            <input type="checkbox" defaultChecked />
            <span>상시근로자 5인 이상 사업장 적용 가능성을 확인했습니다.</span>
          </label>

          <div className={styles.fieldGrid}>
            {fields.map(({ name, label, unit, required, description }) => {
              const fieldErrors = errorsByField[name] ?? [];
              const descriptionId = `${name}-description`;
              const errorId = `${name}-error`;
              const describedBy = [
                descriptionId,
                fieldErrors.length > 0 ? errorId : null,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div className={styles.field} key={name}>
                  <div className={styles.labelRow}>
                    <label htmlFor={name}>{label}</label>
                    {!required && <span className={styles.optionalChip}>선택 입력</span>}
                  </div>
                  <div
                    className={`${styles.inputShell} ${
                      fieldErrors.length > 0 ? styles.inputShellError : ""
                    }`}
                  >
                    <input
                      ref={(element) => {
                        if (element) {
                          inputRefs.current[name] = element;
                        }
                      }}
                      id={name}
                      name={name}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={input[name]}
                      onChange={handleChange}
                      aria-invalid={fieldErrors.length > 0}
                      aria-describedby={describedBy}
                    />
                    <span aria-hidden="true">{unit}</span>
                  </div>
                  <p className={styles.fieldDescription} id={descriptionId}>
                    {description}
                  </p>
                  {fieldErrors.length > 0 && (
                    <p className={styles.fieldError} id={errorId}>
                      {fieldErrors.map(getErrorMessage).join(" ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {errors.length > 0 && (
            <div className={styles.errorSummary} role="alert">
              입력값을 확인해 주세요.
              <ul>
                {errors.map((error) => (
                  <li key={`${error.field}-${error.code}`}>{getErrorMessage(error)}</li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.storageNotice}>
            입력값은 서버로 전송하지 않고 현재 브라우저에만 저장됩니다.
          </p>

          <div className={styles.actions}>
            <button className={styles.calculateButton} type="submit">
              수당 계산하기
            </button>
            <button className={styles.resetButton} type="button" onClick={handleReset}>
              다시 계산
            </button>
          </div>
        </form>

        <section className={styles.resultCard} aria-labelledby="overtime-result-heading">
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 계산 결과</p>
              <h2 id="overtime-result-heading">예상 수당 결과</h2>
            </div>
          </div>

          <div className={styles.resultLive} aria-live="polite">
            {!result && errors.length === 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">₩</span>
                <p>시급과 시간을 입력하면 예상 지급액을 보여드립니다.</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">!</span>
                <p>오류를 수정하면 결과를 확인할 수 있습니다.</p>
              </div>
            )}

            {result && (
              <div className={isResultStale ? styles.staleResult : undefined}>
                {isResultStale && (
                  <p className={styles.staleNotice} role="status">
                    입력값이 변경되었습니다. 다시 계산하면 변경분이 반영됩니다.
                  </p>
                )}

                <div className={styles.primaryResult}>
                  <p>총 예상 지급액</p>
                  <strong>{formatWon(result.totalExpectedPay)}</strong>
                  <span>{result.interpretation}</span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>기본근로 금액</dt>
                    <dd>{formatWon(result.basePay)}</dd>
                  </div>
                  <div>
                    <dt>가산수당 합계</dt>
                    <dd>{formatWon(result.additionalAllowanceTotal)}</dd>
                  </div>
                  <div>
                    <dt>전체 실제 근로시간</dt>
                    <dd>{formatHours(result.totalEnteredHours)}</dd>
                  </div>
                </dl>

                <div className={styles.detailSection}>
                  <h3>상세 계산 내역</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>연장근로수당</dt>
                      <dd>{formatWon(result.overtimePay)}</dd>
                    </div>
                    <div>
                      <dt>야간근로 가산수당</dt>
                      <dd>{formatWon(result.nightPremiumPay)}</dd>
                    </div>
                    <div>
                      <dt>휴일근로 8시간 이내 수당</dt>
                      <dd>{formatWon(result.holidayPayWithin8)}</dd>
                    </div>
                    <div>
                      <dt>휴일근로 8시간 초과 수당</dt>
                      <dd>{formatWon(result.holidayPayOver8)}</dd>
                    </div>
                    <div>
                      <dt>일반 1.0배 상당액</dt>
                      <dd>{formatWon(result.regularEquivalentPay)}</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.formulaSection}>
                  <h3>결과 해석</h3>
                  <p>
                    기준일 2026년 8월 9일, 근로기준법 제56조 기준을 참고한
                    예상값입니다. 실제 지급액은 통상임금 산정과 사업장 조건에
                    따라 달라질 수 있습니다.
                  </p>
                </div>

                {!isResultStale && (
                  <div className={styles.resultActions}>
                    <button type="button" onClick={handleCopy}>
                      결과 복사
                    </button>
                    <button type="button" onClick={handleShare}>
                      {isShareSupported ? "결과 공유" : "공유 확인"}
                    </button>
                  </div>
                )}

                <p className={styles.actionMessage} aria-live="polite">
                  {actionMessage}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

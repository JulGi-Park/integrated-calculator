"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateLaborPay,
  MINIMUM_HOURLY_WAGE_2026,
  MAX_HOURLY_WAGE,
  type LaborPayInput,
  type LaborPayInputField,
  type LaborPayResult,
  type LaborPayValidationError,
} from "@/lib/calculators/labor-pay/laborPay";
import {
  buildLaborPayResultText,
  formatLaborPayHours,
  formatLaborPayWon,
  initialLaborPayInput,
  parseLaborPayInput,
  type LaborPayRawInputs,
} from "./laborPayClientUtils";
import styles from "./LaborPayCalculator.module.css";

interface FieldDefinition {
  name: Exclude<LaborPayInputField, "isFullAttendance">;
  label: string;
  unit: "원" | "시간" | "일";
  helper?: string;
}

const fields: FieldDefinition[] = [
  { name: "hourlyWage", label: "시급", unit: "원" },
  { name: "weeklyScheduledHours", label: "1주 소정근로시간", unit: "시간" },
  { name: "weeklyActualHours", label: "1주 실제 근로시간", unit: "시간" },
  {
    name: "averageWeeklyScheduledHours",
    label: "4주 평균 주 소정근로시간 (선택)",
    unit: "시간",
    helper: "비워두면 1주 소정근로시간으로 판정합니다.",
  },
  {
    name: "weeklyWorkDays",
    label: "주 근무일수 (선택)",
    unit: "일",
    helper: "1일부터 7일 사이로 입력합니다.",
  },
];

const labels: Record<LaborPayInputField, string> = {
  hourlyWage: "시급",
  weeklyScheduledHours: "1주 소정근로시간",
  weeklyActualHours: "실제 근로시간",
  isFullAttendance: "소정근로일 개근 여부",
  averageWeeklyScheduledHours: "4주 평균 주 소정근로시간",
  weeklyWorkDays: "주 근무일수",
};

function getErrorMessage(error: LaborPayValidationError) {
  const label = labels[error.field];

  switch (error.code) {
    case "REQUIRED":
    case "INVALID_NUMBER":
      return `${label} 값을 숫자로 입력해 주세요.`;
    case "MUST_BE_POSITIVE":
      return `${label}은 0보다 큰 값으로 입력해 주세요.`;
    case "MUST_BE_NON_NEGATIVE":
      return `${label}은 0 이상으로 입력해 주세요.`;
    case "AMOUNT_OUT_OF_RANGE":
      return `${label}은 ${MAX_HOURLY_WAGE.toLocaleString("ko-KR")}원 이하로 입력해 주세요.`;
    case "HOURS_OUT_OF_RANGE":
      return `${label}은 168시간 이하로 입력해 주세요.`;
    case "WORK_DAYS_OUT_OF_RANGE":
      return "주 근무일수는 1일부터 7일 사이로 입력해 주세요.";
    case "MUST_BE_BOOLEAN":
      return "소정근로일 개근 여부를 선택해 주세요.";
  }
}

export function LaborPayCalculator() {
  const [input, setInput] = useState<LaborPayRawInputs>(initialLaborPayInput);
  const [errors, setErrors] = useState<LaborPayValidationError[]>([]);
  const [result, setResult] = useState<LaborPayResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<LaborPayInput | null>(
    null,
  );
  const [isResultStale, setIsResultStale] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const inputRefs = useRef<Partial<Record<LaborPayInputField, HTMLInputElement>>>(
    {},
  );

  const errorsByField = errors.reduce<
    Partial<Record<LaborPayInputField, LaborPayValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function markStale() {
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof LaborPayRawInputs;
    const value =
      event.currentTarget.type === "checkbox"
        ? event.currentTarget.checked
        : event.currentTarget.value;

    setInput((current) => ({ ...current, [field]: value }));
    markStale();
  }

  function handleAttendanceChange(value: "true" | "false") {
    setInput((current) => ({ ...current, isFullAttendance: value }));
    markStale();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseLaborPayInput(input);
    const response = calculateLaborPay(parsed as LaborPayInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);

      const firstError = response.errors[0];
      if (firstError) {
        inputRefs.current[firstError.field]?.focus();
      }

      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsed as LaborPayInput);
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(initialLaborPayInput);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
  }

  async function handleCopy() {
    if (!result || !calculatedInput) {
      return;
    }

    const text = buildLaborPayResultText(calculatedInput, result);

    try {
      await navigator.clipboard.writeText(text);
      setActionMessage("계산 결과를 복사했습니다.");
    } catch {
      setActionMessage(
        "클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.",
      );
    }
  }

  async function handleShare() {
    if (!result || !calculatedInput) {
      return;
    }

    const text = buildLaborPayResultText(calculatedInput, result);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "주휴수당 계산 결과", text });
        setActionMessage("공유 창을 열었습니다.");
        return;
      } catch {
        // Fallback to clipboard below.
      }
    }

    await handleCopy();
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>Step 1</p>
            <h2>근무 조건 입력</h2>
          </div>
          <p>소수 시간 입력이 가능합니다.</p>
        </div>

        <div className={styles.fieldGrid}>
          {fields.map(({ name, label, unit, helper }) => {
            const fieldErrors = errorsByField[name] ?? [];
            const errorId = `${name}-error`;

            return (
              <div className={styles.field} key={name}>
                <label htmlFor={name}>{label}</label>
                <div
                  className={`${styles.inputShell} ${
                    fieldErrors.length > 0 ? styles.inputShellError : ""
                  }`}
                >
                  <input
                    ref={(node) => {
                      if (node) {
                        inputRefs.current[name] = node;
                      }
                    }}
                    id={name}
                    name={name}
                    inputMode="decimal"
                    value={input[name]}
                    onChange={handleInputChange}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={
                      fieldErrors.length > 0 ? errorId : undefined
                    }
                  />
                  <span>{unit}</span>
                </div>
                {name === "hourlyWage" ? (
                  <button
                    className={styles.smallButton}
                    type="button"
                    onClick={() => {
                      setInput((current) => ({
                        ...current,
                        hourlyWage: String(MINIMUM_HOURLY_WAGE_2026),
                      }));
                      markStale();
                    }}
                  >
                    2026 최저임금 적용
                  </button>
                ) : null}
                {helper ? <p className={styles.helper}>{helper}</p> : null}
                {fieldErrors.map((error) => (
                  <p
                    className={styles.fieldError}
                    id={errorId}
                    key={error.code}
                    role="alert"
                  >
                    {getErrorMessage(error)}
                  </p>
                ))}
              </div>
            );
          })}

          <fieldset className={`${styles.field} ${styles.fieldFull}`}>
            <legend className={styles.fieldLegend}>소정근로일 개근 여부</legend>
            <div className={styles.segmented}>
              <button
                className={`${styles.segmentButton} ${
                  input.isFullAttendance === "true"
                    ? styles.segmentButtonActive
                    : ""
                }`}
                type="button"
                onClick={() => handleAttendanceChange("true")}
                aria-pressed={input.isFullAttendance === "true"}
              >
                개근
              </button>
              <button
                className={`${styles.segmentButton} ${
                  input.isFullAttendance === "false"
                    ? styles.segmentButtonActive
                    : ""
                }`}
                type="button"
                onClick={() => handleAttendanceChange("false")}
                aria-pressed={input.isFullAttendance === "false"}
              >
                개근 아님
              </button>
            </div>
            {(errorsByField.isFullAttendance ?? []).map((error) => (
              <p
                className={styles.fieldError}
                key={error.code}
                role="alert"
              >
                {getErrorMessage(error)}
              </p>
            ))}
          </fieldset>

          <label className={`${styles.checkboxRow} ${styles.fieldFull}`}>
            <input
              name="includeMonthlyEstimate"
              type="checkbox"
              checked={input.includeMonthlyEstimate}
              onChange={handleInputChange}
            />
            월 환산 표시
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            주휴수당 계산하기
          </button>
          <button
            className={styles.resetButton}
            type="button"
            onClick={handleReset}
          >
            다시 계산
          </button>
        </div>
      </form>

      <section
        className={styles.resultCard}
        aria-label="주휴수당 계산 결과"
        aria-live="polite"
      >
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>Step 2</p>
            <h2>결과 요약</h2>
          </div>
          <p>입력값 기준 예상값</p>
        </div>

        <div className={styles.resultLive}>
          {!result ? (
            <div className={styles.emptyResult}>
              <span aria-hidden="true">₩</span>
              <p>근무 조건을 입력하고 계산하면 결과가 표시됩니다.</p>
            </div>
          ) : (
            <div>
              {isResultStale ? (
                <p className={styles.staleNotice}>
                  입력값이 바뀌었습니다. 다시 계산하면 최신 결과로 갱신됩니다.
                </p>
              ) : null}

              {result.warnings.map((warning) => (
                <p className={styles.warning} key={warning}>
                  {warning}
                </p>
              ))}

              <div className={styles.primaryResult}>
                <span
                  className={`${styles.status} ${
                    result.isEligible ? styles.eligible : styles.ineligible
                  }`}
                >
                  {result.isEligible ? "지급 대상" : "지급 대상 아님"}
                </span>
                <p>예상 주휴수당</p>
                <strong>{formatLaborPayWon(result.weeklyHolidayPay)}</strong>
              </div>

              <dl className={styles.resultList}>
                <div>
                  <dt>예상 주휴시간</dt>
                  <dd>{formatLaborPayHours(result.weeklyHolidayHours)}</dd>
                </div>
                <div>
                  <dt>기본 근로수당</dt>
                  <dd>{formatLaborPayWon(result.baseWeeklyPay)}</dd>
                </div>
                <div>
                  <dt>주휴 포함 예상 주급</dt>
                  <dd>{formatLaborPayWon(result.weeklyPayIncludingHoliday)}</dd>
                </div>
                <div>
                  <dt>판정 기준 시간</dt>
                  <dd>{formatLaborPayHours(result.eligibilityBasisHours)}</dd>
                </div>
                {result.monthlyEstimate !== null ? (
                  <div>
                    <dt>참고용 월 환산액</dt>
                    <dd>{formatLaborPayWon(result.monthlyEstimate)}</dd>
                  </div>
                ) : null}
              </dl>

              {result.reasons.length > 0 ? (
                <ul className={styles.reasonList}>
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}

              <dl className={styles.detailList} aria-label="상세 계산 내역">
                <div>
                  <dt>주휴시간 계산식</dt>
                  <dd>소정근로시간 / 40 × 8</dd>
                </div>
                <div>
                  <dt>8시간 상한</dt>
                  <dd>{result.appliedHolidayHourCap ? "적용" : "미적용"}</dd>
                </div>
                <div>
                  <dt>주휴수당 계산식</dt>
                  <dd>주휴시간 × 시급</dd>
                </div>
              </dl>

              <div className={styles.resultActions}>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={handleCopy}
                >
                  결과 복사
                </button>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={handleShare}
                >
                  공유
                </button>
              </div>
              {actionMessage ? (
                <p className={styles.actionMessage}>{actionMessage}</p>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

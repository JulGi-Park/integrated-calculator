"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { SEVERANCE_POLICY_2026 } from "@/lib/calculators/severance/policy";
import { calculateSeverance } from "@/lib/calculators/severance/severance";
import type {
  AppliedDailyWageReason,
  SeveranceCalculationResponse,
  SeveranceInput,
  SeveranceInputField,
  SeveranceResult,
  SeveranceValidationError,
} from "@/lib/calculators/severance/types";
import {
  buildSeveranceResultText,
  formatSeveranceAmountInput,
  initialSeveranceInputs,
  parseSeveranceStoredInputs,
  SEVERANCE_STORAGE_KEY,
  serializeSeveranceInputs,
  type SeveranceRawInputs,
} from "./severanceClientUtils";
import styles from "./SeveranceCalculator.module.css";

type FieldDefinition = {
  name: SeveranceInputField;
  label: string;
  unit: string | null;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "date";
  required: boolean;
  description: string;
};

const fields: FieldDefinition[] = [
  {
    name: "employmentStartDate",
    label: "입사일",
    unit: null,
    type: "date",
    required: true,
    description: "실제 근로를 시작한 날짜를 입력합니다.",
  },
  {
    name: "retirementDate",
    label: "퇴직일",
    unit: null,
    type: "date",
    required: true,
    description: "마지막 근무일의 다음 날을 입력합니다.",
  },
  {
    name: "wagesForAveragePeriod",
    label: "퇴직 전 3개월 임금총액",
    unit: "원",
    type: "text",
    inputMode: "numeric",
    required: true,
    description: "평균임금 산정기간에 지급된 세전 임금 총액입니다.",
  },
  {
    name: "annualBonusTotal",
    label: "최근 1년 상여금 총액",
    unit: "원",
    type: "text",
    inputMode: "numeric",
    required: true,
    description: "퇴직 전 1년간 지급된 상여금 총액입니다. 없으면 0원을 입력합니다.",
  },
  {
    name: "annualLeaveAllowanceTotal",
    label: "반영 대상 연차수당 총액",
    unit: "원",
    type: "text",
    inputMode: "numeric",
    required: true,
    description:
      "평균임금에 반영할 전년도 연차수당 총액입니다. 없으면 0원을 입력합니다.",
  },
  {
    name: "ordinaryDailyWage",
    label: "1일 통상임금",
    unit: "원",
    type: "text",
    inputMode: "numeric",
    required: false,
    description: "입력하지 않으면 평균임금만으로 계산합니다.",
  },
  {
    name: "averageWeeklyContractHours",
    label: "4주 평균 주당 소정근로시간",
    unit: "시간",
    type: "text",
    inputMode: "decimal",
    required: true,
    description: "퇴직 전 4주 평균 기준입니다. 15시간 미만이면 비대상입니다.",
  },
];

const fieldLabels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<SeveranceInputField, string>;

const amountFields = new Set<SeveranceInputField>([
  "wagesForAveragePeriod",
  "annualBonusTotal",
  "annualLeaveAllowanceTotal",
  "ordinaryDailyWage",
]);

function parseInputs(input: SeveranceRawInputs): Record<string, unknown> {
  return {
    employmentStartDate: input.employmentStartDate || undefined,
    retirementDate: input.retirementDate || undefined,
    wagesForAveragePeriod:
      input.wagesForAveragePeriod.trim() === ""
        ? undefined
        : Number(input.wagesForAveragePeriod.replaceAll(",", "")),
    annualBonusTotal:
      input.annualBonusTotal.trim() === ""
        ? undefined
        : Number(input.annualBonusTotal.replaceAll(",", "")),
    annualLeaveAllowanceTotal:
      input.annualLeaveAllowanceTotal.trim() === ""
        ? undefined
        : Number(input.annualLeaveAllowanceTotal.replaceAll(",", "")),
    ordinaryDailyWage:
      input.ordinaryDailyWage.trim() === ""
        ? null
        : Number(input.ordinaryDailyWage.replaceAll(",", "")),
    averageWeeklyContractHours:
      input.averageWeeklyContractHours.trim() === ""
        ? undefined
        : Number(input.averageWeeklyContractHours),
  };
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString("ko-KR");
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatWonFlexible(value: number): string {
  return `${formatNumber(value)}원`;
}

function getErrorMessage(error: SeveranceValidationError): string {
  const label = fieldLabels[error.field];

  switch (error.code) {
    case "REQUIRED":
      return `${label}을(를) 입력해 주세요.`;
    case "INVALID_NUMBER":
      return `${label} 값을 숫자로 입력해 주세요.`;
    case "MUST_BE_INTEGER":
      return `${label} 값은 정수로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${label} 값이 허용 범위를 벗어났습니다.`;
    case "MUST_BE_POSITIVE":
      return `${label}은(는) 0원보다 커야 합니다.`;
    case "MUST_BE_NON_NEGATIVE":
      return error.field === "averageWeeklyContractHours"
        ? "4주 평균 주당 소정근로시간은 0시간 이상이어야 합니다."
        : `${label}은(는) 0원 이상이어야 합니다.`;
    case "AMOUNT_EXCEEDS_LIMIT":
      return `${label}은(는) ${formatWon(SEVERANCE_POLICY_2026.maximumAmount)} 이하여야 합니다.`;
    case "INVALID_DATE_FORMAT":
      return `${label}은(는) YYYY-MM-DD 형식이어야 합니다.`;
    case "INVALID_DATE":
      return `${label}은(는) 실제 존재하는 날짜여야 합니다.`;
    case "RETIREMENT_BEFORE_START":
      return "퇴직일은 입사일보다 빠를 수 없습니다.";
    case "RETIREMENT_SAME_AS_START":
      return "퇴직일은 입사일과 같을 수 없습니다.";
    case "HOURS_EXCEED_LIMIT":
      return "4주 평균 주당 소정근로시간은 168시간 이하여야 합니다.";
    case "HOURS_PRECISION_EXCEEDED":
      return "4주 평균 주당 소정근로시간은 소수점 이하 2자리까지 입력할 수 있습니다.";
  }
}

function getAppliedDailyWageMessage(reason: AppliedDailyWageReason): string {
  switch (reason) {
    case "ORDINARY_WAGE_HIGHER":
      return "1일 통상임금이 1일 평균임금보다 높아 통상임금을 퇴직금 계산에 적용했습니다.";
    case "AVERAGE_WAGE_HIGHER_OR_EQUAL":
      return "1일 평균임금이 1일 통상임금보다 높거나 같아 평균임금을 적용했습니다.";
    case "AVERAGE_WAGE_USED_NO_ORDINARY_WAGE":
      return "1일 통상임금을 입력하지 않아 1일 평균임금을 적용했습니다.";
  }
}

function getIneligibilityMessage(result: SeveranceResult): string {
  switch (result.ineligibilityReasonCode) {
    case "CONTINUOUS_SERVICE_UNDER_ONE_YEAR":
      return "계속근로기간이 1년 미만이라 퇴직급여 비대상으로 계산되었습니다.";
    case "WEEKLY_HOURS_UNDER_15":
      return "4주 평균 주당 소정근로시간이 15시간 미만이라 퇴직급여 비대상으로 계산되었습니다.";
    case "BOTH_REQUIREMENTS_NOT_MET":
      return "계속근로기간 1년 미만과 주당 15시간 미만 조건이 모두 충족되지 않아 퇴직급여 비대상으로 계산되었습니다.";
    default:
      return "";
  }
}

export function SeveranceCalculator() {
  const [input, setInput] = useState<SeveranceRawInputs>(
    initialSeveranceInputs,
  );
  const [errors, setErrors] = useState<SeveranceValidationError[]>([]);
  const [result, setResult] = useState<SeveranceResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<SeveranceInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<
    Partial<Record<SeveranceInputField, HTMLInputElement>>
  >({});

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(SEVERANCE_STORAGE_KEY);

        if (storedValue !== null) {
          const restoredInput = parseSeveranceStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(SEVERANCE_STORAGE_KEY);
          }
        }
      } catch {
        // Browser storage is optional; calculation remains available.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const errorsByField = errors.reduce<
    Partial<Record<SeveranceInputField, SeveranceValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SeveranceInputField;
    const rawValue = event.currentTarget.value;
    const nextValue = amountFields.has(field)
      ? formatSeveranceAmountInput(rawValue)
      : rawValue;
    const nextInput = {
      ...input,
      [field]: nextValue,
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
          SEVERANCE_STORAGE_KEY,
          serializeSeveranceInputs(nextInput),
        );
      } catch {
        // Storage failure must not block input or calculation.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setActionMessage("");

    try {
      const parsedInput = parseInputs(input);
      const response: SeveranceCalculationResponse =
        calculateSeverance(parsedInput);

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
      setCalculatedInput(parsedInput as unknown as SeveranceInput);
      setIsResultStale(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(SEVERANCE_STORAGE_KEY);
    } catch {
      // Screen reset continues even if storage deletion is unavailable.
    }

    setInput(initialSeveranceInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.employmentStartDate?.focus();
  }

  async function copyWithFallback(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through to the document-based copy attempt.
    }

    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
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

  function getCurrentResultText(): string | null {
    if (!result || !calculatedInput || isResultStale || errors.length > 0) {
      return null;
    }

    try {
      return buildSeveranceResultText(
        calculatedInput,
        result,
      );
    } catch {
      return null;
    }
  }

  async function handleCopy() {
    setActionMessage("");
    const text = getCurrentResultText();

    if (!text) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    const copied = await copyWithFallback(text);
    setActionMessage(
      copied
        ? "계산 결과를 복사했습니다."
        : "결과를 복사하지 못했습니다. 다시 시도해 주세요.",
    );
  }

  async function handleShare() {
    setActionMessage("");
    const text = getCurrentResultText();

    if (!text || typeof navigator.share !== "function") {
      return;
    }

    try {
      const shareData: ShareData = {
        title: "퇴직금 계산 결과",
        text,
      };

      if (
        window.location.protocol === "http:" ||
        window.location.protocol === "https:"
      ) {
        shareData.url = window.location.href;
      }

      await navigator.share(shareData);
      setActionMessage("계산 결과를 공유했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("");
      } else {
        setActionMessage(
          "결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.",
        );
      }
    }
  }

  return (
    <>
      <aside className={styles.policyNotice} aria-label="퇴직금 계산 기준">
        <strong>입력 전 확인</strong>
        <p>
          퇴직일은 마지막 근무일이 아니라 다음 날입니다. 퇴직 전 3개월
          임금총액은 해당 기간의 세전 임금을 합산해 한 번에 입력합니다.
        </p>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 근무 조건</p>
              <h2>퇴직금 계산 정보를 입력하세요</h2>
            </div>
            <p>법정 예상 계산</p>
          </div>

          <div className={styles.fieldGrid}>
            {fields.map(
              ({
                name,
                label,
                unit,
                inputMode,
                type = "text",
                required,
                description,
              }) => {
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
                      {!required && (
                        <span className={styles.optionalChip}>선택 입력</span>
                      )}
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
                        type={type}
                        inputMode={inputMode}
                        autoComplete="off"
                        value={input[name]}
                        onChange={handleChange}
                        aria-invalid={fieldErrors.length > 0}
                        aria-describedby={describedBy}
                      />
                      {unit && <span aria-hidden="true">{unit}</span>}
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
              },
            )}
          </div>

          <p className={styles.storageNotice}>
            입력값은 서버로 전송하지 않고 현재 브라우저에만 저장됩니다.
          </p>

          {errors.length > 0 && (
            <div className={styles.errorSummary} role="alert">
              입력값을 확인해 주세요.
              <ul>
                {errors.map((error) => (
                  <li key={`${error.field}-${error.code}`}>
                    {getErrorMessage(error)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.calculateButton}
              type="submit"
              disabled={isSubmitting}
            >
              퇴직금 계산하기
            </button>
            <button
              className={styles.resetButton}
              type="button"
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </form>

        <section
          className={styles.resultCard}
          aria-labelledby="severance-result-heading"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 계산 결과</p>
              <h2 id="severance-result-heading">퇴직금 계산 결과</h2>
            </div>
          </div>

          <div className={styles.resultLive} aria-live="polite">
            {!result && errors.length === 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">₩</span>
                <p>입력값을 채운 뒤 계산하면 예상 퇴직금을 보여드립니다.</p>
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
                    입력값이 변경되었습니다. 변경된 조건을 반영하려면 다시 계산하세요.
                  </p>
                )}

                <div
                  className={`${styles.statusNotice} ${
                    !result.isBasicallyEligible
                      ? styles.statusNoticeWarning
                      : ""
                  }`}
                  role="status"
                >
                  {!result.isBasicallyEligible
                    ? getIneligibilityMessage(result)
                    : getAppliedDailyWageMessage(result.appliedDailyWageReason)}
                </div>

                <div className={styles.primaryResult}>
                  <p>예상 퇴직금</p>
                  <strong>{formatWon(result.estimatedSeverance)}</strong>
                  <span>
                    {result.isBasicallyEligible
                      ? "퇴직급여 대상입니다."
                      : "퇴직급여 비대상으로 계산되었습니다."}
                  </span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>퇴직급여 대상 여부</dt>
                    <dd>{result.isBasicallyEligible ? "대상" : "비대상"}</dd>
                  </div>
                  <div>
                    <dt>총 재직일수</dt>
                    <dd>{result.totalServiceDays.toLocaleString("ko-KR")}일</dd>
                  </div>
                  <div>
                    <dt>실제 적용 1일 임금</dt>
                    <dd>{formatWonFlexible(result.appliedDailyWage)}</dd>
                  </div>
                  <div>
                    <dt>기준 확인일</dt>
                    <dd>{formatKoreanDate(result.policyVerifiedAt)}</dd>
                  </div>
                </dl>

                <div className={styles.detailSection}>
                  <h3>상세 결과</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>평균임금 산정 시작일</dt>
                      <dd>{formatKoreanDate(result.averageWagePeriodStartDate)}</dd>
                    </div>
                    <div>
                      <dt>평균임금 산정 종료일</dt>
                      <dd>{formatKoreanDate(result.averageWagePeriodEndDate)}</dd>
                    </div>
                    <div>
                      <dt>평균임금 산정 총 역일수</dt>
                      <dd>{result.averageWagePeriodDays.toLocaleString("ko-KR")}일</dd>
                    </div>
                    <div>
                      <dt>퇴직 전 3개월 임금총액</dt>
                      <dd>{formatWon(result.wagesForAveragePeriod)}</dd>
                    </div>
                    <div>
                      <dt>상여금 반영액</dt>
                      <dd>{formatWonFlexible(result.reflectedBonusAmount)}</dd>
                    </div>
                    <div>
                      <dt>연차수당 반영액</dt>
                      <dd>
                        {formatWonFlexible(
                          result.reflectedAnnualLeaveAllowanceAmount,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>평균임금 산정 임금총액</dt>
                      <dd>{formatWonFlexible(result.totalWagesForAverageWage)}</dd>
                    </div>
                    <div>
                      <dt>1일 평균임금</dt>
                      <dd>{formatWonFlexible(result.averageDailyWage)}</dd>
                    </div>
                    <div>
                      <dt>입력된 1일 통상임금</dt>
                      <dd>
                        {result.ordinaryDailyWage === null
                          ? "입력하지 않음"
                          : formatWon(result.ordinaryDailyWage)}
                      </dd>
                    </div>
                    <div>
                      <dt>최종 적용 1일 임금</dt>
                      <dd>{formatWonFlexible(result.appliedDailyWage)}</dd>
                    </div>
                    <div>
                      <dt>주당 소정근로시간 요건</dt>
                      <dd>
                        {result.meetsWeeklyHoursRequirement
                          ? "15시간 이상"
                          : "15시간 미만"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.formulaSection}>
                  <h3>예상 퇴직금 계산 산식</h3>
                  <dl>
                    <div>
                      <dt>적용 산식</dt>
                      <dd>
                        {formatWonFlexible(result.appliedDailyWage)} × 30일 ×{" "}
                        {result.totalServiceDays.toLocaleString("ko-KR")}일 ÷
                        365일
                      </dd>
                    </div>
                    <div>
                      <dt>예상 퇴직금</dt>
                      <dd>{formatWon(result.estimatedSeverance)}</dd>
                    </div>
                  </dl>
                </div>

                <p className={styles.disclaimer}>
                  입력값과 {formatKoreanDate(result.policyVerifiedAt)} 기준의
                  예상 계산 결과이며, 실제 지급액은 사업장 규정과 산정 자료에
                  따라 달라질 수 있습니다.
                </p>

                {!isResultStale && calculatedInput && (
                  <div className={styles.resultActions}>
                    <button type="button" onClick={handleCopy}>
                      결과 복사
                    </button>
                    {isShareSupported && (
                      <button type="button" onClick={handleShare}>
                        공유
                      </button>
                    )}
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

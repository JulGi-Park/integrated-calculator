"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { calculateSocialInsurance } from "@/lib/calculators/social-insurance/calculate";
import { SOCIAL_INSURANCE_POLICY_2026 } from "@/lib/calculators/social-insurance/constants";
import type {
  SocialInsuranceInput,
  SocialInsuranceInputField,
  SocialInsuranceResult,
  SocialInsuranceValidationError,
} from "@/lib/calculators/social-insurance/types";
import {
  buildSocialInsuranceResultText,
  initialSocialInsuranceInputs,
  parseSocialInsuranceStoredInputs,
  serializeSocialInsuranceInputs,
  SOCIAL_INSURANCE_STORAGE_KEY,
  type SocialInsuranceRawInputs,
} from "./socialInsuranceClientUtils";
import styles from "./SocialInsuranceCalculator.module.css";

interface FieldDefinition {
  name: SocialInsuranceInputField;
  label: string;
  description: string;
}

const fields: FieldDefinition[] = [
  {
    name: "monthlySalary",
    label: "월 급여",
    description: "세전 월 급여를 원 단위로 입력합니다.",
  },
  {
    name: "nonTaxableAmount",
    label: "비과세 금액",
    description: "식대 등 매월 적용되는 비과세 금액입니다. 없으면 0원입니다.",
  },
];

const fieldLabels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<SocialInsuranceInputField, string>;

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function parseInputs(input: SocialInsuranceRawInputs): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([field, value]) => [
      field,
      value.trim() === "" && field === "nonTaxableAmount"
        ? 0
        : value.trim() === ""
          ? undefined
          : Number(value.replaceAll(",", "")),
    ]),
  );
}

function getErrorMessage(error: SocialInsuranceValidationError): string {
  const label = fieldLabels[error.field];

  switch (error.code) {
    case "REQUIRED":
      return "월 급여를 입력해 주세요.";
    case "INVALID_NUMBER":
      return `${label}은 숫자로 입력해 주세요.`;
    case "MUST_BE_INTEGER":
      return `${label}은 원 단위 정수로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${label}이 허용 범위를 벗어났습니다.`;
    case "MUST_BE_POSITIVE":
      return "월 급여는 0원보다 커야 합니다.";
    case "MUST_BE_NON_NEGATIVE":
      return "비과세 금액은 0원 이상이어야 합니다.";
    case "AMOUNT_EXCEEDS_LIMIT":
      return `${label}은 ${formatWon(SOCIAL_INSURANCE_POLICY_2026.maximumInputAmount)} 이하여야 합니다.`;
    case "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY":
      return "비과세 금액은 월 급여보다 클 수 없습니다.";
    case "TAXABLE_PAY_MUST_BE_POSITIVE":
      return "과세기준급여는 0원보다 커야 합니다.";
    case "NON_FINITE_RESULT":
      return "계산 결과를 확인할 수 없습니다.";
  }
}

function getPensionBaseStatusLabel(status: SocialInsuranceResult["pensionBaseStatus"]) {
  switch (status) {
    case "minimum":
      return "하한 적용";
    case "maximum":
      return "상한 적용";
    case "within":
      return "입력 기준 적용";
  }
}

export function SocialInsuranceCalculator() {
  const [input, setInput] = useState<SocialInsuranceRawInputs>(
    initialSocialInsuranceInputs,
  );
  const [errors, setErrors] = useState<SocialInsuranceValidationError[]>([]);
  const [result, setResult] = useState<SocialInsuranceResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<SocialInsuranceInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<
    Partial<Record<SocialInsuranceInputField, HTMLInputElement>>
  >({});

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      try {
        const storedValue = window.localStorage.getItem(
          SOCIAL_INSURANCE_STORAGE_KEY,
        );

        if (storedValue !== null) {
          const restoredInput = parseSocialInsuranceStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(SOCIAL_INSURANCE_STORAGE_KEY);
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
    Partial<Record<SocialInsuranceInputField, SocialInsuranceValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SocialInsuranceInputField;
    const value = event.currentTarget.value;
    const nextInput = { ...input, [field]: value };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }

    if (hasRestoredInputs.current) {
      try {
        window.localStorage.setItem(
          SOCIAL_INSURANCE_STORAGE_KEY,
          serializeSocialInsuranceInputs(nextInput),
        );
      } catch {
        // Storage failure must not block calculation.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseInputs(input);
    const response = calculateSocialInsurance(parsedInput);
    setActionMessage("");

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);

      const firstInputError = fields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      if (firstInputError) {
        inputRefs.current[firstInputError.name]?.focus();
      }
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as SocialInsuranceInput);
    setIsResultStale(false);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(SOCIAL_INSURANCE_STORAGE_KEY);
    } catch {
      // Screen reset continues even if storage deletion is unavailable.
    }

    setInput(initialSocialInsuranceInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.monthlySalary?.focus();
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

    return buildSocialInsuranceResultText(calculatedInput, result);
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
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: "2026 4대보험 계산 결과",
        text,
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

  const policy = SOCIAL_INSURANCE_POLICY_2026;

  return (
    <>
      <aside className={styles.policyNotice} aria-label="4대보험 적용 기준">
        <strong>2026년 7월 7일 확인 기준</strong>
        <p>
          국민연금은 {formatWon(policy.nationalPension.standardMonthlyIncomeMinimum)}
          ~{formatWon(policy.nationalPension.standardMonthlyIncomeMaximum)} 기준소득월액
          범위를 적용합니다. 산재보험은 근로자 급여 공제 항목이 아니어서 자동
          계산하지 않습니다.
        </p>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 급여 입력</p>
              <h2>계산 기준 급여를 입력하세요</h2>
            </div>
            <p>과세기준급여 = 월 급여 - 비과세 금액</p>
          </div>

          <div className={styles.fieldGrid}>
            {fields.map(({ name, label, description }) => {
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
                  <label htmlFor={name}>{label}</label>
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
                      inputMode="numeric"
                      autoComplete="off"
                      value={input[name]}
                      onChange={handleChange}
                      aria-invalid={fieldErrors.length > 0}
                      aria-describedby={describedBy}
                    />
                    <span aria-hidden="true">원</span>
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

          <p className={styles.storageNotice}>
            입력값은 서버로 전송하지 않고 현재 브라우저에만 저장됩니다.
          </p>

          {errors.length > 0 && (
            <p className={styles.errorSummary} role="alert">
              입력값을 확인해 주세요.
            </p>
          )}

          <div className={styles.actions}>
            <button className={styles.calculateButton} type="submit">
              4대보험 계산하기
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
          aria-labelledby="social-insurance-result-heading"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 예상 결과</p>
              <h2 id="social-insurance-result-heading">근로자 부담 공제액</h2>
            </div>
          </div>

          <div className={styles.resultLive} aria-live="polite">
            {!result && errors.length === 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">₩</span>
                <p>월 급여와 비과세 금액을 입력한 후 계산해 주세요.</p>
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
                    입력값이 변경되었습니다. 다시 계산해 주세요.
                  </p>
                )}

                <div className={styles.primaryResult}>
                  <p>총 공제액</p>
                  <strong>{formatWon(result.totalEmployeeContribution)}</strong>
                  <span>
                    공제 후 참고 금액 {formatWon(result.afterContributionAmount)}
                  </span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>국민연금</dt>
                    <dd>{formatWon(result.employeePension)}</dd>
                  </div>
                  <div>
                    <dt>건강보험</dt>
                    <dd>{formatWon(result.employeeHealthInsurance)}</dd>
                  </div>
                  <div>
                    <dt>장기요양보험</dt>
                    <dd>{formatWon(result.employeeLongTermCare)}</dd>
                  </div>
                  <div>
                    <dt>고용보험</dt>
                    <dd>{formatWon(result.employeeEmploymentInsurance)}</dd>
                  </div>
                  <div>
                    <dt>총 공제액</dt>
                    <dd>{formatWon(result.totalEmployeeContribution)}</dd>
                  </div>
                  <div>
                    <dt>공제 후 참고 금액</dt>
                    <dd>{formatWon(result.afterContributionAmount)}</dd>
                  </div>
                </dl>

                <div className={styles.detailSection}>
                  <h3>상세 계산</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>과세기준급여</dt>
                      <dd>{formatWon(result.taxableMonthlyPay)}</dd>
                    </div>
                    <div>
                      <dt>국민연금 기준급여</dt>
                      <dd>
                        {formatWon(result.pensionBase)} ·{" "}
                        {getPensionBaseStatusLabel(result.pensionBaseStatus)}
                      </dd>
                    </div>
                    <div>
                      <dt>국민연금 계산식</dt>
                      <dd>{formatWon(result.pensionBase)} × 4.75%</dd>
                    </div>
                    <div>
                      <dt>건강보험 계산식</dt>
                      <dd>{formatWon(result.taxableMonthlyPay)} × 3.595%</dd>
                    </div>
                    <div>
                      <dt>장기요양 계산식</dt>
                      <dd>{formatWon(result.employeeHealthInsurance)} × 13.14%</dd>
                    </div>
                    <div>
                      <dt>고용보험 계산식</dt>
                      <dd>{formatWon(result.taxableMonthlyPay)} × 0.9%</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.detailSection}>
                  <h3>결과 해석</h3>
                  <p className={styles.interpretation}>
                    월급명세서의 실제 공제액은 회사 신고 보수월액, 비과세
                    처리, 건강보험 정산, 입퇴사일, 적용 제외 여부에 따라 달라질
                    수 있습니다. 산재보험은 근로자 급여 공제 항목이 아니며,
                    업종별 사업주 부담 보험료라 본 계산기에서는 자동 계산하지
                    않습니다.
                  </p>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>기준 확인일</dt>
                      <dd>{formatKoreanDate(result.policyVerifiedAt)}</dd>
                    </div>
                    <div>
                      <dt>포함 항목</dt>
                      <dd>국민연금, 건강보험, 장기요양보험, 고용보험</dd>
                    </div>
                    <div>
                      <dt>제외 항목</dt>
                      <dd>산재보험, 소득세, 지방소득세, 회사별 추가 공제</dd>
                    </div>
                  </dl>
                </div>

                {!isResultStale && calculatedInput && (
                  <div className={styles.resultActions}>
                    <button type="button" onClick={handleCopy}>
                      결과 복사
                    </button>
                    <button type="button" onClick={handleShare}>
                      공유
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

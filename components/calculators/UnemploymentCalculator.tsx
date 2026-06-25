"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import { UNEMPLOYMENT_POLICY_2026 } from "@/lib/calculators/unemployment/policy";
import { calculateUnemploymentBenefit } from "@/lib/calculators/unemployment/unemployment";
import type {
  UnemploymentAgeGroup,
  UnemploymentInputField,
  UnemploymentLeavingReason,
  UnemploymentResult,
  UnemploymentValidationError,
  UnemploymentWageInputType,
} from "@/lib/calculators/unemployment/types";
import styles from "./UnemploymentCalculator.module.css";

type RawInputs = {
  wageInputType: UnemploymentWageInputType;
  wageAmount: string;
  insuredMonths: string;
  ageGroup: UnemploymentAgeGroup | "";
  leavingReason: UnemploymentLeavingReason | "";
};

const initialInputs: RawInputs = {
  wageInputType: "monthlyWage",
  wageAmount: "",
  insuredMonths: "",
  ageGroup: "",
  leavingReason: "",
};

const fieldLabels: Record<UnemploymentInputField, string> = {
  wageInputType: "임금 입력 방식",
  wageAmount: "임금 금액",
  insuredMonths: "고용보험 가입기간",
  ageGroup: "나이 구간",
  leavingReason: "퇴직 사유",
};

const leavingReasonOptions: Array<{
  value: UnemploymentLeavingReason;
  label: string;
  description: string;
}> = [
  {
    value: "involuntary",
    label: "비자발적 퇴사",
    description: "해고 등 본인 의사와 무관한 이직입니다.",
  },
  {
    value: "contractExpired",
    label: "계약만료",
    description: "기간제 계약 종료 등 계약기간 만료입니다.",
  },
  {
    value: "recommendedResignation",
    label: "권고사직",
    description: "사업주 권고에 따른 퇴사입니다.",
  },
  {
    value: "voluntary",
    label: "자발적 퇴사",
    description: "일반적으로 제한될 수 있어 확인이 필요합니다.",
  },
  {
    value: "voluntaryExceptionReview",
    label: "자발적 퇴사 예외 검토 필요",
    description: "질병, 임금체불, 통근 곤란 등 증빙 검토가 필요합니다.",
  },
  {
    value: "unclear",
    label: "기타 또는 판단 어려움",
    description: "고용센터 또는 공식 절차 확인이 필요합니다.",
  },
];

function formatAmountInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly === "") {
    return "";
  }

  return Number(digitsOnly).toLocaleString("ko-KR");
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getErrorMessage(error: UnemploymentValidationError): string {
  const label = fieldLabels[error.field];

  switch (error.code) {
    case "REQUIRED":
      return `${label}을(를) 입력해 주세요.`;
    case "INVALID_NUMBER":
      return `${label}은(는) 숫자로 입력해 주세요.`;
    case "MUST_BE_INTEGER":
      return `${label}은(는) 정수로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${label}이(가) 허용 범위를 벗어났습니다.`;
    case "MUST_BE_POSITIVE":
      return `${label}은(는) 0보다 커야 합니다.`;
    case "AMOUNT_BELOW_LIMIT":
    case "AMOUNT_EXCEEDS_LIMIT":
    case "INSURED_MONTHS_UNDER_MINIMUM":
    case "INSURED_MONTHS_EXCEEDS_LIMIT":
    case "INVALID_OPTION":
      return error.message;
  }
}

function parseInputs(input: RawInputs): Record<string, unknown> {
  return {
    wageInputType: input.wageInputType,
    wageAmount:
      input.wageAmount.trim() === ""
        ? undefined
        : Number(input.wageAmount.replaceAll(",", "")),
    insuredMonths:
      input.insuredMonths.trim() === ""
        ? undefined
        : Number(input.insuredMonths),
    ageGroup: input.ageGroup || undefined,
    leavingReason: input.leavingReason || undefined,
  };
}

export function UnemploymentCalculator() {
  const [input, setInput] = useState<RawInputs>(initialInputs);
  const [errors, setErrors] = useState<UnemploymentValidationError[]>([]);
  const [result, setResult] = useState<UnemploymentResult | null>(null);
  const wageInputRef = useRef<HTMLInputElement>(null);
  const insuredMonthsRef = useRef<HTMLInputElement>(null);

  const errorsByField = errors.reduce<
    Partial<Record<UnemploymentInputField, UnemploymentValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleWageTypeChange(event: ChangeEvent<HTMLInputElement>) {
    setInput({
      ...input,
      wageInputType: event.currentTarget.value as UnemploymentWageInputType,
      wageAmount: "",
    });
    setErrors([]);
    setResult(null);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof RawInputs;
    const rawValue = event.currentTarget.value;
    const nextValue =
      field === "wageAmount" ? formatAmountInput(rawValue) : rawValue;

    setInput({
      ...input,
      [field]: nextValue,
    });
    setErrors([]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = calculateUnemploymentBenefit(parseInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);

      const firstError = response.errors[0];
      if (firstError?.field === "wageAmount") {
        wageInputRef.current?.focus();
      } else if (firstError?.field === "insuredMonths") {
        insuredMonthsRef.current?.focus();
      }
      return;
    }

    setErrors([]);
    setResult(response.data);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    wageInputRef.current?.focus();
  }

  const wageAmountErrors = errorsByField.wageAmount ?? [];
  const insuredMonthsErrors = errorsByField.insuredMonths ?? [];
  const ageGroupErrors = errorsByField.ageGroup ?? [];
  const leavingReasonErrors = errorsByField.leavingReason ?? [];
  const wageUnit =
    input.wageInputType === "monthlyWage" ? "월급" : "1일 평균임금";

  return (
    <>
      <aside className={styles.policyNotice} aria-label="실업급여 계산 기준">
        <strong>입력 전 확인</strong>
        <p>
          2026년 6월 25일 작업 기준의 예상 계산입니다. 실제 수급 여부는
          고용보험 가입 이력, 이직확인서, 실업인정과 고용센터 판단에 따라
          달라질 수 있습니다.
        </p>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 수급 조건</p>
              <h2>실업급여 계산 정보를 입력하세요</h2>
            </div>
            <p>예상 계산</p>
          </div>

          <div className={styles.fieldGrid}>
            <fieldset className={styles.field}>
              <legend className={styles.legend}>임금 입력 방식</legend>
              <div className={styles.segmented}>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="wageInputType"
                    value="monthlyWage"
                    checked={input.wageInputType === "monthlyWage"}
                    onChange={handleWageTypeChange}
                  />
                  <strong>월급 기준 간편 입력</strong>
                  <span>월급을 30으로 나누어 1일 평균임금을 추정합니다.</span>
                </label>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="wageInputType"
                    value="averageDailyWage"
                    checked={input.wageInputType === "averageDailyWage"}
                    onChange={handleWageTypeChange}
                  />
                  <strong>1일 평균임금 직접 입력</strong>
                  <span>퇴직 전 평균임금을 알고 있을 때 사용합니다.</span>
                </label>
              </div>
            </fieldset>

            <div className={styles.field}>
              <label htmlFor="wageAmount">{wageUnit} 금액</label>
              <div
                className={`${styles.inputShell} ${
                  wageAmountErrors.length > 0 ? styles.inputShellError : ""
                }`}
              >
                <input
                  ref={wageInputRef}
                  id="wageAmount"
                  name="wageAmount"
                  inputMode="numeric"
                  autoComplete="off"
                  value={input.wageAmount}
                  onChange={handleChange}
                  aria-invalid={wageAmountErrors.length > 0}
                  aria-describedby="wageAmount-description wageAmount-error"
                />
                <span aria-hidden="true">원</span>
              </div>
              <p className={styles.fieldDescription} id="wageAmount-description">
                월급 기준은 간편 추정이며, 1일 평균임금 직접 입력이 더 정확한
                계산에 가깝습니다.
              </p>
              {wageAmountErrors.length > 0 && (
                <p className={styles.fieldError} id="wageAmount-error">
                  {wageAmountErrors.map(getErrorMessage).join(" ")}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="insuredMonths">고용보험 가입기간</label>
              <div
                className={`${styles.inputShell} ${
                  insuredMonthsErrors.length > 0 ? styles.inputShellError : ""
                }`}
              >
                <input
                  ref={insuredMonthsRef}
                  id="insuredMonths"
                  name="insuredMonths"
                  inputMode="numeric"
                  autoComplete="off"
                  value={input.insuredMonths}
                  onChange={handleChange}
                  aria-invalid={insuredMonthsErrors.length > 0}
                  aria-describedby="insuredMonths-description insuredMonths-error"
                />
                <span aria-hidden="true">개월</span>
              </div>
              <p
                className={styles.fieldDescription}
                id="insuredMonths-description"
              >
                6개월 미만은 피보험 단위기간 180일 충족 여부 확인이 먼저
                필요합니다.
              </p>
              {insuredMonthsErrors.length > 0 && (
                <p className={styles.fieldError} id="insuredMonths-error">
                  {insuredMonthsErrors.map(getErrorMessage).join(" ")}
                </p>
              )}
            </div>

            <fieldset className={styles.field}>
              <legend className={styles.legend}>나이 구간</legend>
              <div className={styles.segmented}>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="ageGroup"
                    value="under50"
                    checked={input.ageGroup === "under50"}
                    onChange={handleChange}
                  />
                  <strong>50세 미만</strong>
                  <span>일반 연령 구간입니다.</span>
                </label>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="ageGroup"
                    value="over50OrDisabled"
                    checked={input.ageGroup === "over50OrDisabled"}
                    onChange={handleChange}
                  />
                  <strong>50세 이상 및 장애인</strong>
                  <span>소정급여일수 표에서 별도 구간을 적용합니다.</span>
                </label>
              </div>
              {ageGroupErrors.length > 0 && (
                <p className={styles.fieldError}>
                  {ageGroupErrors.map(getErrorMessage).join(" ")}
                </p>
              )}
            </fieldset>

            <fieldset className={styles.field}>
              <legend className={styles.legend}>퇴직 사유</legend>
              <div className={styles.radioGrid}>
                {leavingReasonOptions.map((option) => (
                  <label className={styles.option} key={option.value}>
                    <input
                      type="radio"
                      name="leavingReason"
                      value={option.value}
                      checked={input.leavingReason === option.value}
                      onChange={handleChange}
                    />
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>
              {leavingReasonErrors.length > 0 && (
                <p className={styles.fieldError}>
                  {leavingReasonErrors.map(getErrorMessage).join(" ")}
                </p>
              )}
            </fieldset>
          </div>

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
            <button className={styles.calculateButton} type="submit">
              실업급여 계산하기
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
          aria-labelledby="unemployment-result-heading"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 계산 결과</p>
              <h2 id="unemployment-result-heading">실업급여 예상 결과</h2>
            </div>
          </div>

          <div className={styles.resultLive} aria-live="polite">
            {!result && errors.length === 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">₩</span>
                <p>입력값을 채운 뒤 계산하면 예상 구직급여를 보여드립니다.</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">!</span>
                <p>오류를 수정하면 결과를 확인할 수 있습니다.</p>
              </div>
            )}

            {result && (
              <div>
                <div
                  className={`${styles.statusNotice} ${
                    result.eligibilityStatus === "possible"
                      ? ""
                      : styles.statusNoticeWarning
                  }`}
                  role="status"
                >
                  {result.eligibilityMessage}
                </div>

                <div className={styles.primaryResult}>
                  <p>예상 총 지급액</p>
                  <strong>{formatWon(result.estimatedTotalBenefit)}</strong>
                  <span>
                    1일 {formatWon(result.dailyBenefitAmount)} ×{" "}
                    {result.prescribedBenefitDays.toLocaleString("ko-KR")}일
                  </span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>1일 예상 구직급여액</dt>
                    <dd>{formatWon(result.dailyBenefitAmount)}</dd>
                  </div>
                  <div>
                    <dt>예상 소정급여일수</dt>
                    <dd>{result.prescribedBenefitDays.toLocaleString("ko-KR")}일</dd>
                  </div>
                  <div>
                    <dt>상한액 적용</dt>
                    <dd>{result.isUpperLimitApplied ? "적용" : "미적용"}</dd>
                  </div>
                  <div>
                    <dt>하한액 적용</dt>
                    <dd>{result.isLowerLimitApplied ? "적용" : "미적용"}</dd>
                  </div>
                </dl>

                <div className={styles.detailSection}>
                  <h3>상세 계산</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>계산 전 기준 급여액</dt>
                      <dd>{formatWon(result.baseDailyBenefit)}</dd>
                    </div>
                    <div>
                      <dt>추정 1일 평균임금</dt>
                      <dd>{formatWon(result.estimatedAverageDailyWage)}</dd>
                    </div>
                    <div>
                      <dt>적용된 상한액</dt>
                      <dd>{formatWon(result.dailyBenefitUpperLimit)}</dd>
                    </div>
                    <div>
                      <dt>적용된 하한액</dt>
                      <dd>{formatWon(result.dailyBenefitLowerLimit)}</dd>
                    </div>
                    <div>
                      <dt>가입기간</dt>
                      <dd>{result.insuredMonths.toLocaleString("ko-KR")}개월</dd>
                    </div>
                    <div>
                      <dt>기준일</dt>
                      <dd>{result.basisDate}</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.detailSection}>
                  <h3>절차 안내</h3>
                  <ul className={styles.guideList}>
                    {result.procedureGuide.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <p className={styles.disclaimer}>
                  {result.disclaimer} {UNEMPLOYMENT_POLICY_2026.sourceNote}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

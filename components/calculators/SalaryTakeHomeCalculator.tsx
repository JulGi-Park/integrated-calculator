"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateSalaryTakeHome,
} from "@/lib/calculators/salary-take-home/salary-take-home";
import {
  SALARY_TAKE_HOME_INPUT_METADATA,
  SALARY_TAKE_HOME_POLICY_2026,
} from "@/lib/calculators/salary-take-home/policy";
import type {
  SalaryTakeHomeInputField,
  SalaryTakeHomeResult,
  SalaryTakeHomeValidationError,
} from "@/lib/calculators/salary-take-home/types";
import styles from "./SalaryTakeHomeCalculator.module.css";

type SalaryRawInputs = Record<SalaryTakeHomeInputField, string>;

interface FieldDefinition {
  name: SalaryTakeHomeInputField;
  label: string;
  unit: "원" | "명";
  description: string;
}

const initialInputs: SalaryRawInputs = {
  annualSalary: "",
  monthlyNonTaxableAmount: "0",
  dependentCount: "1",
  childCount: "0",
};

const fields: FieldDefinition[] = [
  {
    name: "annualSalary",
    label: "연봉",
    unit: "원",
    description: "퇴직금을 제외한 세전 연봉을 입력합니다.",
  },
  {
    name: "monthlyNonTaxableAmount",
    label: "월 비과세액",
    unit: "원",
    description: "매월 급여에 포함되는 비과세 금액을 입력합니다.",
  },
  {
    name: "dependentCount",
    label: "공제대상 가족 수",
    unit: "명",
    description: SALARY_TAKE_HOME_INPUT_METADATA.dependentCount.description,
  },
  {
    name: "childCount",
    label: "간이세액표상 자녀 수",
    unit: "명",
    description: SALARY_TAKE_HOME_INPUT_METADATA.childCount.description,
  },
];

const fieldLabels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<SalaryTakeHomeInputField, string>;

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function getNextDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function parseInputs(input: SalaryRawInputs): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([field, value]) => [
      field,
      value.trim() === "" ? undefined : Number(value.replaceAll(",", "")),
    ]),
  );
}

function getErrorMessage(error: SalaryTakeHomeValidationError): string {
  const label = fieldLabels[error.field];

  switch (error.code) {
    case "REQUIRED":
      return "연봉을 입력해 주세요.";
    case "INVALID_NUMBER":
      return `${label} 값을 숫자로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${label} 값이 허용 범위를 벗어났습니다.`;
    case "MUST_BE_POSITIVE":
      return error.field === "dependentCount"
        ? "공제대상 가족 수는 본인을 포함해 1명 이상이어야 합니다."
        : "연봉은 0원보다 커야 합니다.";
    case "MUST_BE_NON_NEGATIVE":
      return `${label} 값은 0 이상이어야 합니다.`;
    case "MUST_BE_INTEGER":
      return `${label} 값은 정수로 입력해 주세요.`;
    case "ANNUAL_SALARY_EXCEEDS_LIMIT":
      return `연봉은 ${formatWon(
        SALARY_TAKE_HOME_POLICY_2026.maximumAnnualSalary,
      )} 이하여야 합니다.`;
    case "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY":
      return "월 비과세액은 월 급여보다 클 수 없습니다.";
    case "CHILD_COUNT_EXCEEDS_DEPENDENT_COUNT":
      return "자녀 수는 공제대상 가족 수보다 많을 수 없습니다.";
  }
}

export function SalaryTakeHomeCalculator() {
  const [input, setInput] = useState<SalaryRawInputs>(initialInputs);
  const [errors, setErrors] = useState<SalaryTakeHomeValidationError[]>([]);
  const [result, setResult] = useState<SalaryTakeHomeResult | null>(null);
  const [calculatedNonTaxableAmount, setCalculatedNonTaxableAmount] =
    useState<number | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const inputRefs = useRef<
    Partial<Record<SalaryTakeHomeInputField, HTMLInputElement>>
  >({});

  const errorsByField = errors.reduce<
    Partial<
      Record<SalaryTakeHomeInputField, SalaryTakeHomeValidationError[]>
    >
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SalaryTakeHomeInputField;
    const value = event.currentTarget.value;

    setInput((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors([]);

    if (result) {
      setIsResultStale(true);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = calculateSalaryTakeHome(parseInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedNonTaxableAmount(null);
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
    setCalculatedNonTaxableAmount(
      response.data.monthlyGrossSalary - response.data.monthlyTaxableSalary,
    );
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    setCalculatedNonTaxableAmount(null);
    setIsResultStale(false);
    inputRefs.current.annualSalary?.focus();
  }

  const policy = SALARY_TAKE_HOME_POLICY_2026;
  const pensionEffectiveFrom = formatKoreanDate(
    policy.nationalPension.ceilingEffectiveFrom,
  );
  const pensionEffectiveTo = formatKoreanDate(
    policy.nationalPension.ceilingEffectiveTo,
  );
  const pensionChangeDate = formatKoreanDate(
    getNextDate(policy.nationalPension.ceilingEffectiveTo),
  );

  return (
    <>
      <aside className={styles.policyNotice} aria-label="국민연금 적용 기준">
        <strong>현재 국민연금 기준소득월액</strong>
        <p>
          하한 {formatWon(policy.nationalPension.standardMonthlyIncomeMinimum)},
          상한 {formatWon(policy.nationalPension.standardMonthlyIncomeMaximum)}
          을 {pensionEffectiveFrom}부터 {pensionEffectiveTo}까지 적용합니다.
          {pensionChangeDate}부터 변경 기준이 적용될 예정입니다.
        </p>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 급여 조건</p>
              <h2>급여 정보를 입력하세요</h2>
            </div>
            <p>월 급여 기준 예상</p>
          </div>

          <div className={styles.fieldGrid}>
            {fields.map(({ name, label, unit, description }) => {
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
            <p className={styles.errorSummary} role="alert">
              입력값을 확인해 주세요.
            </p>
          )}

          <div className={styles.actions}>
            <button className={styles.calculateButton} type="submit">
              실수령액 계산하기
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
          aria-labelledby="salary-result-heading"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 예상 결과</p>
              <h2 id="salary-result-heading">급여 실수령액</h2>
            </div>
          </div>

          <div className={styles.resultLive} aria-live="polite">
            {!result && errors.length === 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">₩</span>
                <p>연봉을 입력한 후 계산해 주세요.</p>
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
                  <p>월 예상 실수령액</p>
                  <strong>{formatWon(result.estimatedMonthlyTakeHome)}</strong>
                  <span>
                    연간 예상 실수령액{" "}
                    {formatWon(result.estimatedAnnualTakeHome)}
                  </span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>월 예상 실수령액</dt>
                    <dd>{formatWon(result.estimatedMonthlyTakeHome)}</dd>
                  </div>
                  <div>
                    <dt>연간 예상 실수령액</dt>
                    <dd>{formatWon(result.estimatedAnnualTakeHome)}</dd>
                  </div>
                  <div>
                    <dt>월 급여</dt>
                    <dd>{formatWon(result.monthlyGrossSalary)}</dd>
                  </div>
                  <div>
                    <dt>월 공제 합계</dt>
                    <dd>{formatWon(result.totalMonthlyDeductions)}</dd>
                  </div>
                </dl>

                <div className={styles.detailSection}>
                  <h3>상세 공제</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>국민연금</dt>
                      <dd>{formatWon(result.nationalPension)}</dd>
                    </div>
                    <div>
                      <dt>건강보험</dt>
                      <dd>{formatWon(result.healthInsurance)}</dd>
                    </div>
                    <div>
                      <dt>장기요양보험</dt>
                      <dd>{formatWon(result.longTermCareInsurance)}</dd>
                    </div>
                    <div>
                      <dt>고용보험</dt>
                      <dd>{formatWon(result.employmentInsurance)}</dd>
                    </div>
                    <div>
                      <dt>소득세</dt>
                      <dd>{formatWon(result.incomeTax)}</dd>
                    </div>
                    <div>
                      <dt>지방소득세</dt>
                      <dd>{formatWon(result.localIncomeTax)}</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.detailSection}>
                  <h3>계산 기준</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>월 과세 급여</dt>
                      <dd>{formatWon(result.monthlyTaxableSalary)}</dd>
                    </div>
                    <div>
                      <dt>월 비과세액</dt>
                      <dd>{formatWon(calculatedNonTaxableAmount ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>적용 정책</dt>
                      <dd>{result.policyYear}년</dd>
                    </div>
                    <div>
                      <dt>기준 확인일</dt>
                      <dd>{formatKoreanDate(result.policyVerifiedAt)}</dd>
                    </div>
                    <div>
                      <dt>국민연금 적용 기간</dt>
                      <dd>
                        {pensionEffectiveFrom}~{pensionEffectiveTo}
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className={styles.disclaimer}>
                  입력값과 {result.policyYear}년 적용 기준에 따른 예상값이며
                  실제 급여명세서와 차이가 날 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

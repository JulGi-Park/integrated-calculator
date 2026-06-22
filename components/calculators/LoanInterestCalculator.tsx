"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateLoanRepaymentComparison,
} from "@/lib/calculators/loan/loan-repayment";
import { LOAN_REPAYMENT_POLICY } from "@/lib/calculators/loan/policy";
import type {
  LoanRepaymentComparisonResult,
  LoanRepaymentInput,
  LoanRepaymentInputField,
  LoanRepaymentType,
  LoanRepaymentValidationError,
  LoanScheduleItem,
} from "@/lib/calculators/loan/types";
import styles from "./LoanInterestCalculator.module.css";

type RawInputs = Record<LoanRepaymentInputField, string>;

const INITIAL_VISIBLE_INSTALLMENTS = 20;
const VISIBLE_INSTALLMENT_STEP = 20;

const initialInputs: RawInputs = {
  principal: "",
  annualInterestRate: "",
  termMonths: "",
};

const repaymentLabels: Record<LoanRepaymentType, string> = {
  equalPayment: "원리금균등상환",
  equalPrincipal: "원금균등상환",
  bullet: "만기일시상환",
};

const repaymentDescriptions: Record<LoanRepaymentType, string> = {
  equalPayment: "매월 원금과 이자의 합계가 대체로 일정합니다.",
  equalPrincipal: "매월 같은 기본 원금을 갚아 납입액이 점차 감소합니다.",
  bullet: "기간 중 이자를 납부하고 마지막 회차에 원금을 상환합니다.",
};

const fields: Array<{
  name: LoanRepaymentInputField;
  label: string;
  unit: string;
  inputMode: "numeric" | "decimal";
  description: string;
}> = [
  {
    name: "principal",
    label: "대출금액",
    unit: "원",
    inputMode: "numeric",
    description: "원 단위로 입력합니다. 최대 100억원은 서비스 계산 제한입니다.",
  },
  {
    name: "annualInterestRate",
    label: "연이율",
    unit: "%",
    inputMode: "decimal",
    description: "0%부터 100%까지, 소수점 이하 최대 4자리를 지원합니다.",
  },
  {
    name: "termMonths",
    label: "대출기간",
    unit: "개월",
    inputMode: "numeric",
    description: "정수 개월로 입력합니다. 최대 600개월이며 30년은 360개월입니다.",
  },
];

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatPrincipalInput(value: string): string {
  const normalized = value.replaceAll(",", "");

  if (!/^-?\d+$/.test(normalized)) {
    return value;
  }

  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function parseInputs(input: RawInputs): Record<string, unknown> {
  return {
    principal:
      input.principal.trim() === ""
        ? undefined
        : Number(input.principal.replaceAll(",", "")),
    annualInterestRate:
      input.annualInterestRate.trim() === ""
        ? undefined
        : Number(input.annualInterestRate),
    termMonths:
      input.termMonths.trim() === ""
        ? undefined
        : Number(input.termMonths),
  };
}

function formatRate(value: number): string {
  return `${value}%`;
}

function formatTerm(termMonths: number): string {
  const years = Math.floor(termMonths / 12);
  const months = termMonths % 12;

  if (years === 0) {
    return `${termMonths}개월`;
  }

  const detail = months === 0 ? `${years}년` : `${years}년 ${months}개월`;
  return `${termMonths}개월(${detail})`;
}

function formatTypeList(types: LoanRepaymentType[]): string {
  const labels = types.map((type) => repaymentLabels[type]);
  return types.length > 1 ? `${labels.join(", ")} 공동` : labels[0];
}

function getErrorMessage(error: LoanRepaymentValidationError): string {
  const fieldLabel = fields.find(({ name }) => name === error.field)?.label;

  switch (error.code) {
    case "REQUIRED":
      return `${fieldLabel}을 입력해 주세요.`;
    case "INVALID_NUMBER":
      return `${fieldLabel}을 숫자로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${fieldLabel}이 안전한 정수 범위를 벗어났습니다.`;
    case "MUST_BE_POSITIVE":
      return `${fieldLabel}은 0보다 커야 합니다.`;
    case "MUST_BE_NON_NEGATIVE":
      return "연이율은 0% 이상이어야 합니다.";
    case "MUST_BE_INTEGER":
      return `${fieldLabel}은 정수로 입력해 주세요.`;
    case "PRINCIPAL_EXCEEDS_LIMIT":
      return `대출금액은 ${formatWon(
        LOAN_REPAYMENT_POLICY.maximumPrincipal,
      )} 이하여야 합니다.`;
    case "RATE_EXCEEDS_LIMIT":
      return "연이율은 서비스 계산 제한인 100% 이하여야 합니다.";
    case "RATE_PRECISION_EXCEEDED":
      return "연이율은 소수점 이하 4자리까지 입력해 주세요.";
    case "TERM_EXCEEDS_LIMIT":
      return "대출기간은 600개월 이하여야 합니다.";
  }
}

function getRepaymentResult(
  result: LoanRepaymentComparisonResult,
  type: LoanRepaymentType,
) {
  return result[type];
}

function ScheduleRow({ item }: { item: LoanScheduleItem }) {
  return (
    <tr>
      <th scope="row">{item.installmentNumber}</th>
      <td>{formatWon(item.openingBalance)}</td>
      <td>{formatWon(item.principalPayment)}</td>
      <td>{formatWon(item.interestPayment)}</td>
      <td>{formatWon(item.monthlyPayment)}</td>
      <td>{formatWon(item.closingBalance)}</td>
    </tr>
  );
}

export function LoanInterestCalculator() {
  const [input, setInput] = useState<RawInputs>(initialInputs);
  const [errors, setErrors] = useState<LoanRepaymentValidationError[]>([]);
  const [result, setResult] =
    useState<LoanRepaymentComparisonResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<LoanRepaymentInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [selectedType, setSelectedType] =
    useState<LoanRepaymentType>("equalPayment");
  const [visibleInstallments, setVisibleInstallments] = useState(
    INITIAL_VISIBLE_INSTALLMENTS,
  );
  const inputRefs = useRef<
    Partial<Record<LoanRepaymentInputField, HTMLInputElement>>
  >({});

  const errorsByField = errors.reduce<
    Partial<Record<LoanRepaymentInputField, LoanRepaymentValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as LoanRepaymentInputField;
    const rawValue = event.currentTarget.value;
    const value =
      field === "principal" ? formatPrincipalInput(rawValue) : rawValue;

    setInput((current) => ({ ...current, [field]: value }));
    setErrors([]);

    if (result) {
      setIsResultStale(true);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedInput = parseInputs(input);
    const response = calculateLoanRepaymentComparison(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);
      setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);

      const firstErrorField = fields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      inputRefs.current[firstErrorField?.name ?? "principal"]?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as LoanRepaymentInput);
    setIsResultStale(false);
    setSelectedType("equalPayment");
    setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setSelectedType("equalPayment");
    setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);
    inputRefs.current.principal?.focus();
  }

  function selectRepaymentType(type: LoanRepaymentType) {
    setSelectedType(type);
    setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);
  }

  const selectedResult = result
    ? getRepaymentResult(result, selectedType)
    : null;
  const visibleSchedule = selectedResult?.schedule.slice(
    0,
    visibleInstallments,
  );
  const lastInstallment = selectedResult?.schedule.at(-1);
  const hasMoreSchedule =
    selectedResult !== null &&
    visibleInstallments < selectedResult.schedule.length;

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 대출 조건</p>
            <h2>대출 정보를 입력하세요</h2>
          </div>
          <p>월 단위 예상 계산</p>
        </div>

        <div className={styles.fieldGrid}>
          {fields.map(({ name, label, unit, inputMode, description }) => {
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
                    inputMode={inputMode}
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
            상환방식 비교하기
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

      {!result && (
        <section className={styles.emptyCard} aria-live="polite">
          <span aria-hidden="true">₩</span>
          <h2>상환방식을 비교해 보세요</h2>
          <p>대출 조건을 입력하면 세 방식의 예상 비용과 일정을 보여드립니다.</p>
        </section>
      )}

      {result && calculatedInput && (
        <div className={styles.results}>
          {isResultStale && (
            <p className={styles.staleNotice} role="status">
              입력값이 변경되었습니다. 다시 계산해 주세요.
            </p>
          )}

          <section
            className={styles.summaryCard}
            aria-labelledby="loan-result-heading"
          >
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>02 · 비교 요약</p>
                <h2 id="loan-result-heading">대출 상환 비교 결과</h2>
              </div>
              <p>예상값</p>
            </div>

            <div className={styles.resultLive} aria-live="polite">
              <dl className={styles.loanSummary}>
                <div>
                  <dt>대출금액</dt>
                  <dd>{formatWon(calculatedInput.principal)}</dd>
                </div>
                <div>
                  <dt>연이율</dt>
                  <dd>{formatRate(calculatedInput.annualInterestRate)}</dd>
                </div>
                <div>
                  <dt>대출기간</dt>
                  <dd>{formatTerm(calculatedInput.termMonths)}</dd>
                </div>
              </dl>

              <div className={styles.winnerGrid}>
                <div>
                  <span>총이자가 가장 적은 방식</span>
                  <strong>
                    {formatTypeList(result.lowestTotalInterestTypes)}
                  </strong>
                </div>
                <div>
                  <span>첫 달 부담이 가장 적은 방식</span>
                  <strong>
                    {formatTypeList(result.lowestFirstMonthPaymentTypes)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section
            className={styles.comparisonSection}
            aria-labelledby="comparison-heading"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.step}>03 · 방식별 비교</p>
                <h2 id="comparison-heading">세 상환방식을 비교하세요</h2>
              </div>
              <p>총이자와 초기 부담은 서로 다른 기준입니다.</p>
            </div>

            <div className={styles.comparisonGrid}>
              {(
                [
                  "equalPayment",
                  "equalPrincipal",
                  "bullet",
                ] as LoanRepaymentType[]
              ).map((type) => {
                const repayment = getRepaymentResult(result, type);
                const first = repayment.schedule[0];
                const last = repayment.schedule[repayment.schedule.length - 1];

                return (
                  <article className={styles.comparisonCard} key={type}>
                    <h3>{repaymentLabels[type]}</h3>
                    <p>{repaymentDescriptions[type]}</p>
                    <dl>
                      <div>
                        <dt>첫 달 납입액</dt>
                        <dd>{formatWon(first.monthlyPayment)}</dd>
                      </div>
                      <div>
                        <dt>
                          {type === "bullet"
                            ? "만기 월 납입액"
                            : "마지막 달 납입액"}
                        </dt>
                        <dd>{formatWon(last.monthlyPayment)}</dd>
                      </div>
                      <div>
                        <dt>총이자</dt>
                        <dd>{formatWon(repayment.totalInterest)}</dd>
                      </div>
                      <div>
                        <dt>총상환금액</dt>
                        <dd>{formatWon(repayment.totalPayment)}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className={styles.scheduleSection}
            aria-labelledby="schedule-heading"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.step}>04 · 월별 일정</p>
                <h2 id="schedule-heading">월별 상환 일정</h2>
              </div>
              <p aria-live="polite">
                현재 {repaymentLabels[selectedType]} 일정
              </p>
            </div>

            <div className={styles.typeSelector} aria-label="상환방식 선택">
              {(
                [
                  "equalPayment",
                  "equalPrincipal",
                  "bullet",
                ] as LoanRepaymentType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={selectedType === type}
                  onClick={() => selectRepaymentType(type)}
                >
                  {repaymentLabels[type]}
                </button>
              ))}
            </div>

            <div
              className={styles.tableScroller}
              role="region"
              aria-label={`${repaymentLabels[selectedType]} 월별 상환 일정 표. 가로로 스크롤할 수 있습니다.`}
              tabIndex={0}
            >
              <table>
                <caption>{repaymentLabels[selectedType]} 월별 상환 일정</caption>
                <thead>
                  <tr>
                    <th scope="col">회차</th>
                    <th scope="col">납부 전 잔액</th>
                    <th scope="col">원금</th>
                    <th scope="col">이자</th>
                    <th scope="col">월 납입액</th>
                    <th scope="col">납부 후 잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSchedule?.map((item) => (
                    <ScheduleRow item={item} key={item.installmentNumber} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.scheduleActions}>
              <p>
                전체 {selectedResult?.schedule.length}회차 중{" "}
                {visibleSchedule?.length}회차 표시
              </p>
              {hasMoreSchedule && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleInstallments((current) =>
                      Math.min(
                        current + VISIBLE_INSTALLMENT_STEP,
                        selectedResult.schedule.length,
                      ),
                    )
                  }
                >
                  다음 {Math.min(
                    VISIBLE_INSTALLMENT_STEP,
                    selectedResult.schedule.length - visibleInstallments,
                  )}
                  회차 더 보기
                </button>
              )}
            </div>

            {lastInstallment && (
              <aside className={styles.lastInstallment}>
                <strong>마지막 {lastInstallment.installmentNumber}회차</strong>
                <span>
                  월 납입액 {formatWon(lastInstallment.monthlyPayment)}
                </span>
                <span>
                  납부 후 잔액 {formatWon(lastInstallment.closingBalance)}
                </span>
              </aside>
            )}
          </section>

          <aside className={styles.notice}>
            <p>
              실제 금융회사 계산은 납부일, 월별 일수와 원 단위 처리 방식에
              따라 달라질 수 있습니다.
            </p>
            <p>
              인지세, 보증료, 취급수수료와 중도상환수수료는 포함하지
              않습니다.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import {
  calculateRentVsJeonse,
  calculateLegalReferenceRate,
  getDefaultRentVsJeonseInput,
  type CheaperHousingOption,
  type RentVsJeonseInput,
  type RentVsJeonseInputField,
  type RentVsJeonseResult,
  type RentVsJeonseValidationError,
} from "@/lib/calculators/rent-vs-jeonse/rent-vs-jeonse";
import styles from "./RentVsJeonseCalculator.module.css";

type RawInput = Record<RentVsJeonseInputField, string>;

interface FieldDefinition {
  name: RentVsJeonseInputField;
  label: string;
  unit: "원" | "%" | "개월";
  inputMode: "numeric" | "decimal";
  description: string;
}

const defaultInput = getDefaultRentVsJeonseInput();

const groups: Array<{
  title: string;
  fields: FieldDefinition[];
}> = [
  {
    title: "전세 조건",
    fields: [
      {
        name: "jeonseDeposit",
        label: "전세보증금",
        unit: "원",
        inputMode: "numeric",
        description: "계약 전세보증금을 원 단위로 입력합니다.",
      },
      {
        name: "jeonseLoanAmount",
        label: "전세대출금",
        unit: "원",
        inputMode: "numeric",
        description: "대출이 없다면 0원으로 입력합니다.",
      },
      {
        name: "jeonseLoanRate",
        label: "전세대출 연이율",
        unit: "%",
        inputMode: "decimal",
        description: "연 % 기준 금리입니다.",
      },
      {
        name: "jeonseExtraMonthlyCost",
        label: "전세 기타 월비용",
        unit: "원",
        inputMode: "numeric",
        description: "반복되는 월 비용만 입력합니다.",
      },
    ],
  },
  {
    title: "월세 조건",
    fields: [
      {
        name: "monthlyRentDeposit",
        label: "월세 보증금",
        unit: "원",
        inputMode: "numeric",
        description: "월세 계약 보증금을 원 단위로 입력합니다.",
      },
      {
        name: "monthlyRent",
        label: "월세",
        unit: "원",
        inputMode: "numeric",
        description: "매월 납부하는 월세입니다.",
      },
      {
        name: "monthlyMaintenanceFee",
        label: "월세 관리비",
        unit: "원",
        inputMode: "numeric",
        description: "매월 반복되는 관리비입니다.",
      },
      {
        name: "opportunityRate",
        label: "보증금 기회비용 연이율",
        unit: "%",
        inputMode: "decimal",
        description: "보증금에 묶이는 돈의 연 % 기준 기회비용입니다.",
      },
      {
        name: "residenceMonths",
        label: "거주 예정 기간",
        unit: "개월",
        inputMode: "numeric",
        description: "정수 개월로 입력합니다.",
      },
    ],
  },
  {
    title: "전월세전환율 참고값",
    fields: [
      {
        name: "baseRate",
        label: "한국은행 기준금리",
        unit: "%",
        inputMode: "decimal",
        description: "2026-07-02 기본값은 2.50%입니다.",
      },
      {
        name: "legalAdditionalRate",
        label: "시행령상 가산 이율",
        unit: "%",
        inputMode: "decimal",
        description: "2026-07-02 기본값은 2.00%입니다.",
      },
      {
        name: "maxLegalRate",
        label: "법정 상한율",
        unit: "%",
        inputMode: "decimal",
        description: "법정 참고 구조의 상한율입니다.",
      },
    ],
  },
];

const fields = groups.flatMap((group) => group.fields);

const labels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<RentVsJeonseInputField, string>;

function toRawInput(input: RentVsJeonseInput): RawInput {
  return Object.fromEntries(
    Object.entries(input).map(([field, value]) => [
      field,
      value.toLocaleString("ko-KR", { maximumFractionDigits: 4 }),
    ]),
  ) as RawInput;
}

function formatNumericInput(value: string): string {
  const normalized = value.replaceAll(",", "");

  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return value;
  }

  const [integerPart, decimalPart] = normalized.split(".");
  const sign = integerPart.startsWith("-") ? "-" : "";
  const digits = sign ? integerPart.slice(1) : integerPart;
  const formattedInteger = `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  return decimalPart === undefined
    ? formattedInteger
    : `${formattedInteger}.${decimalPart}`;
}

function parseInput(input: RawInput): Record<string, unknown> {
  const parsed = Object.fromEntries(
    Object.entries(input).map(([field, value]) => [
      field,
      value.trim() === "" ? undefined : Number(value.replaceAll(",", "")),
    ]),
  );

  if (
    typeof parsed.baseRate === "number" &&
    typeof parsed.legalAdditionalRate === "number" &&
    typeof parsed.maxLegalRate === "number"
  ) {
    parsed.conversionRate = calculateLegalReferenceRate({
      baseRate: parsed.baseRate,
      legalAdditionalRate: parsed.legalAdditionalRate,
      maxLegalRate: parsed.maxLegalRate,
    });
  }

  return parsed;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatRate(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}%`;
}

function getErrorMessage(error: RentVsJeonseValidationError): string {
  const label = labels[error.field] ?? "입력값";

  switch (error.code) {
    case "REQUIRED":
      return `${label}을 입력해 주세요.`;
    case "INVALID_NUMBER":
      return `${label}을 유한한 숫자로 입력해 주세요.`;
    case "MUST_BE_INTEGER":
      return `${label}은 정수로 입력해 주세요.`;
    case "MUST_BE_NON_NEGATIVE":
    case "MUST_BE_POSITIVE":
    case "LOAN_EXCEEDS_DEPOSIT":
      return error.message;
  }
}

function getCheaperLabel(option: CheaperHousingOption): string {
  if (option === "jeonse") {
    return "전세가 더 저렴합니다";
  }

  if (option === "monthlyRent") {
    return "월세가 더 저렴합니다";
  }

  return "입력값 기준 두 선택지의 총비용이 거의 같습니다";
}

function getInterpretation(result: RentVsJeonseResult): string {
  if (result.cheaperOption === "jeonse") {
    return "입력값 기준으로 월세보다 전세의 월 환산 부담 또는 거주 기간 총비용이 낮게 계산됩니다. 다만 보증금 규모, 대출 가능 여부, 중도상환수수료, 이사 계획은 별도로 검토해야 합니다.";
  }

  if (result.cheaperOption === "monthlyRent") {
    return "입력값 기준으로 대출이자와 보증금 기회비용을 고려하면 월세의 예상 부담이 더 낮게 계산됩니다. 다만 장기 거주, 월세 인상, 관리비 변동은 별도로 검토해야 합니다.";
  }

  return "입력값 기준 전세와 월세의 총비용이 거의 같습니다. 금리, 거주기간, 보증금 차이에 따라 결과가 쉽게 바뀔 수 있으므로 입력값을 조금씩 바꿔 민감도를 확인해 보세요.";
}

function DetailCard({
  title,
  items,
}: Readonly<{
  title: string;
  items: Array<{ label: string; value: string }>;
}>) {
  return (
    <article className={styles.detailCard}>
      <h3>{title}</h3>
      <dl>
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function RentVsJeonseCalculator() {
  const [input, setInput] = useState<RawInput>(() => toRawInput(defaultInput));
  const [errors, setErrors] = useState<RentVsJeonseValidationError[]>([]);
  const [result, setResult] = useState<RentVsJeonseResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<RentVsJeonseInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const inputRefs = useRef<
    Partial<Record<RentVsJeonseInputField, HTMLInputElement>>
  >({});

  const errorsByField = errors.reduce<
    Partial<Record<RentVsJeonseInputField, RentVsJeonseValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as RentVsJeonseInputField;
    const nextInput = {
      ...input,
      [field]: formatNumericInput(event.currentTarget.value),
    };

    setInput(nextInput);
    setErrors([]);

    if (result) {
      setIsResultStale(true);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseInput(input);
    const response = calculateRentVsJeonse(parsedInput);

    if (!response.success) {
      setResult(null);
      setCalculatedInput(null);
      setErrors(response.errors);
      setIsResultStale(false);

      const firstError = response.errors[0];
      if (firstError) {
        inputRefs.current[firstError.field]?.focus();
      }

      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as RentVsJeonseInput);
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(toRawInput(defaultInput));
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    inputRefs.current.jeonseDeposit?.focus();
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>Step 1</p>
            <h2>입력값</h2>
          </div>
          <p>
            금액은 원 단위, 금리는 연 % 기준, 거주 예정 기간은 개월 단위로
            입력합니다.
          </p>
        </div>

        {groups.map((group) => (
          <section className={styles.fieldGroup} key={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <div className={styles.fieldGrid}>
              {group.fields.map(({ name, label, unit, inputMode, description }) => {
                const fieldErrors = errorsByField[name] ?? [];
                const hasError = fieldErrors.length > 0;
                const errorId = `${name}-error`;
                const descriptionId = `${name}-description`;

                return (
                  <div className={styles.field} key={name}>
                    <label htmlFor={name}>{label}</label>
                    <div
                      className={`${styles.inputShell} ${
                        hasError ? styles.inputShellError : ""
                      }`}
                    >
                      <input
                        aria-describedby={
                          hasError ? `${descriptionId} ${errorId}` : descriptionId
                        }
                        aria-invalid={hasError}
                        id={name}
                        inputMode={inputMode}
                        name={name}
                        onChange={handleChange}
                        ref={(element) => {
                          inputRefs.current[name] = element ?? undefined;
                        }}
                        value={input[name]}
                      />
                      <span>{unit}</span>
                    </div>
                    <p className={styles.fieldDescription} id={descriptionId}>
                      {description}
                    </p>
                    {hasError ? (
                      <p className={styles.fieldError} id={errorId}>
                        {fieldErrors.map(getErrorMessage).join(" ")}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {errors.length > 0 ? (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요. 계산 결과는 오류가 해결된 뒤 표시됩니다.
          </p>
        ) : null}

        {isResultStale ? (
          <p className={styles.staleNotice} role="status">
            입력값이 변경되었습니다. 다시 계산하면 새 결과가 표시됩니다.
          </p>
        ) : null}

        <p className={styles.helperText}>
          기본값은 참고용 예시이며 사용자가 직접 수정할 수 있습니다.
        </p>

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            계산하기
          </button>
          <button className={styles.resetButton} onClick={handleReset} type="button">
            초기화
          </button>
        </div>
      </form>

      {result && calculatedInput ? (
        <div className={styles.results}>
          <section className={styles.summaryCard} aria-labelledby="summary-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.step}>Step 2</p>
                <h2 id="summary-title">결과 요약</h2>
              </div>
              <p>입력값 기준 예상 비교입니다.</p>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span>전세 월 환산 부담</span>
                <strong>{formatWon(result.jeonseMonthlyBurden)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>월세 월 부담</span>
                <strong>{formatWon(result.monthlyRentBurden)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>월 부담 차이</span>
                <strong>{formatWon(result.monthlyBurdenDifference)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>전세 총비용</span>
                <strong>{formatWon(result.jeonseTotalCost)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>월세 총비용</span>
                <strong>{formatWon(result.monthlyRentTotalCost)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>총비용 차이</span>
                <strong>{formatWon(result.totalCostDifference)}</strong>
              </div>
              <div className={styles.winner}>
                <span>더 저렴한 선택지</span>
                <strong>{getCheaperLabel(result.cheaperOption)}</strong>
              </div>
            </div>
          </section>

          <section className={styles.detailSection} aria-labelledby="detail-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.step}>Step 3</p>
                <h2 id="detail-title">상세 계산 내역</h2>
              </div>
              <p>
                전세, 월세, 전월세전환율 참고 항목을 같은 원 단위 기준으로
                정리했습니다.
              </p>
            </div>
            <div className={styles.detailGrid}>
              <DetailCard
                title="전세 상세"
                items={[
                  {
                    label: "전세대출 월 이자",
                    value: formatWon(result.jeonseMonthlyInterestCost),
                  },
                  {
                    label: "전세 자기자본",
                    value: formatWon(result.jeonseEquity),
                  },
                  {
                    label: "전세 자기자본 월 기회비용",
                    value: formatWon(result.jeonseEquityMonthlyOpportunityCost),
                  },
                  {
                    label: "전세 기타 월비용",
                    value: formatWon(result.jeonseExtraMonthlyCost),
                  },
                  {
                    label: "전세 월 환산 부담",
                    value: formatWon(result.jeonseMonthlyBurden),
                  },
                  {
                    label: "거주 기간 총비용",
                    value: formatWon(result.jeonseTotalCost),
                  },
                ]}
              />
              <DetailCard
                title="월세 상세"
                items={[
                  {
                    label: "월세 보증금 월 기회비용",
                    value: formatWon(result.monthlyRentDepositMonthlyOpportunityCost),
                  },
                  { label: "월세", value: formatWon(calculatedInput.monthlyRent) },
                  {
                    label: "관리비",
                    value: formatWon(calculatedInput.monthlyMaintenanceFee),
                  },
                  {
                    label: "월세 월 부담",
                    value: formatWon(result.monthlyRentBurden),
                  },
                  {
                    label: "거주 기간 총비용",
                    value: formatWon(result.monthlyRentTotalCost),
                  },
                ]}
              />
              <DetailCard
                title="전월세전환율 참고"
                items={[
                  { label: "기준금리", value: formatRate(calculatedInput.baseRate) },
                  {
                    label: "시행령상 가산 이율",
                    value: formatRate(calculatedInput.legalAdditionalRate),
                  },
                  {
                    label: "법정 상한율",
                    value: formatRate(calculatedInput.maxLegalRate),
                  },
                  {
                    label: "참고 전월세전환율",
                    value: formatRate(result.legalReferenceRate),
                  },
                  {
                    label: "보증금 차이",
                    value: formatWon(result.depositDifference),
                  },
                  {
                    label: "보증금 차이의 월세 환산액",
                    value: formatWon(result.depositDifferenceMonthlyRentEquivalent),
                  },
                ]}
              />
            </div>
          </section>

          <aside className={styles.interpretation} aria-labelledby="interpretation-title">
            <h2 id="interpretation-title">결과 해석</h2>
            <p>{getInterpretation(result)}</p>
          </aside>
        </div>
      ) : (
        <section className={styles.emptyCard} aria-labelledby="empty-result-title">
          <span aria-hidden="true">=</span>
          <h2 id="empty-result-title">계산 전입니다</h2>
          <p>입력값을 확인한 뒤 계산하면 결과 요약과 상세 내역이 표시됩니다.</p>
        </section>
      )}
    </div>
  );
}

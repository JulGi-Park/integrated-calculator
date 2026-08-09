"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateSavings,
  type SavingsInput,
  type SavingsInputField,
  type SavingsInterestType,
  type SavingsProductType,
  type SavingsResult,
  type SavingsTaxType,
  type SavingsValidationError,
} from "@/lib/calculators/savings/savings";
import styles from "./SavingsCalculator.module.css";

type RawInputs = {
  productType: SavingsProductType;
  amount: string;
  termMonths: string;
  annualInterestRate: string;
  taxType: SavingsTaxType;
  interestType: SavingsInterestType;
};

const initialInputs: RawInputs = {
  productType: "deposit",
  amount: "10000000",
  termMonths: "12",
  annualInterestRate: "4",
  taxType: "general",
  interestType: "simple",
};

const numberFields = [
  {
    name: "amount",
    depositLabel: "예치금",
    installmentLabel: "월 납입액",
    unit: "원",
    description:
      "예금은 예치금, 적금은 매월 납입할 금액입니다. 100억원 이하의 원 단위 정수로 입력합니다.",
  },
  {
    name: "termMonths",
    depositLabel: "예치 기간",
    installmentLabel: "납입 기간",
    unit: "개월",
    description: "1개월 이상 600개월 이하의 정수로 입력합니다.",
  },
  {
    name: "annualInterestRate",
    depositLabel: "연 이율",
    installmentLabel: "연 이율",
    unit: "%",
    description: "세전 연 이율을 입력합니다. 우대금리는 최종 적용 금리로 더해 입력하세요.",
  },
] as const satisfies readonly {
  name: "amount" | "termMonths" | "annualInterestRate";
  depositLabel: string;
  installmentLabel: string;
  unit: string;
  description: string;
}[];

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 3 })}%`;
}

function getProductLabel(productType: SavingsProductType): string {
  return productType === "deposit" ? "예금" : "정기적금";
}

function getTaxTypeLabel(taxType: SavingsTaxType): string {
  return taxType === "general" ? "일반 과세" : "비과세";
}

function parseNumberInput(value: string): number | undefined {
  const normalized = value.trim().replaceAll(",", "");
  return normalized === "" ? undefined : Number(normalized);
}

function parseInputs(input: RawInputs): Record<string, unknown> {
  return {
    productType: input.productType,
    amount: parseNumberInput(input.amount),
    termMonths: parseNumberInput(input.termMonths),
    annualInterestRate: parseNumberInput(input.annualInterestRate),
    taxType: input.taxType,
    interestType: input.interestType,
  };
}

function getErrorMessage(error: SavingsValidationError): string {
  return error.message;
}

function buildResultText(input: SavingsInput, result: SavingsResult): string {
  return [
    "예금 적금 계산 결과",
    `상품 유형: ${getProductLabel(result.productType)}`,
    `${result.productType === "deposit" ? "예치금" : "월 납입액"}: ${formatWon(input.amount)}`,
    `기간: ${result.termMonths}개월`,
    `연 이율: ${formatPercent(result.annualInterestRate)}`,
    `과세 방식: ${getTaxTypeLabel(result.taxType)}`,
    `원금 합계: ${formatWon(result.principalTotal)}`,
    `세전 이자: ${formatWon(result.grossInterest)}`,
    `이자소득세: ${formatWon(result.incomeTax)}`,
    `지방소득세: ${formatWon(result.localIncomeTax)}`,
    `총 세금: ${formatWon(result.totalTax)}`,
    `세후 이자: ${formatWon(result.netInterest)}`,
    `만기 수령액: ${formatWon(result.maturityAmount)}`,
  ].join("\n");
}

export function SavingsCalculator() {
  const [input, setInput] = useState(initialInputs);
  const [errors, setErrors] = useState<SavingsValidationError[]>([]);
  const [result, setResult] = useState<SavingsResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<SavingsInput | null>(
    null,
  );
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported] = useState(
    () =>
      typeof navigator !== "undefined" && typeof navigator.share === "function",
  );
  const [actionMessage, setActionMessage] = useState("");
  const inputRefs = useRef<
    Partial<Record<"amount" | "termMonths" | "annualInterestRate", HTMLInputElement>>
  >({});

  const errorsByField = errors.reduce<
    Partial<Record<SavingsInputField, SavingsValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof RawInputs;
    const value = event.currentTarget.value;

    setInput((current) => ({ ...current, [field]: value }));
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    const parsedInput = parseInputs(input);
    const response = calculateSavings(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);
      const firstErrorField = numberFields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      inputRefs.current[firstErrorField?.name ?? "amount"]?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as SavingsInput);
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.amount?.focus();
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

    return buildResultText(calculatedInput, result);
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
        title: "예금 적금 계산 결과",
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
        setActionMessage("결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.");
      }
    }
  }

  const amountLabel =
    input.productType === "deposit" ? "예치금" : "월 납입액";

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 예금 적금 조건</p>
            <h2>계산 조건을 입력하세요</h2>
          </div>
          <p>단리 기준으로 세전 이자, 세금, 세후 이자와 만기 수령액을 계산합니다.</p>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.radioGroup}>
            <span className={styles.fieldLegend}>상품 유형</span>
            <div className={styles.radioOptions}>
              {(["deposit", "installment"] as const).map((productType) => (
                <label className={styles.radioLabel} key={productType}>
                  <input
                    type="radio"
                    name="productType"
                    value={productType}
                    checked={input.productType === productType}
                    onChange={handleInputChange}
                  />
                  {getProductLabel(productType)}
                </label>
              ))}
            </div>
            {errorsByField.productType && (
              <p className={styles.fieldError} role="alert">
                {errorsByField.productType.map(getErrorMessage).join(" ")}
              </p>
            )}
          </div>

          <div className={styles.radioGroup}>
            <span className={styles.fieldLegend}>과세 방식</span>
            <div className={styles.radioOptions}>
              {(["general", "taxFree"] as const).map((taxType) => (
                <label className={styles.radioLabel} key={taxType}>
                  <input
                    type="radio"
                    name="taxType"
                    value={taxType}
                    checked={input.taxType === taxType}
                    onChange={handleInputChange}
                  />
                  {getTaxTypeLabel(taxType)}
                </label>
              ))}
            </div>
            {errorsByField.taxType && (
              <p className={styles.fieldError} role="alert">
                {errorsByField.taxType.map(getErrorMessage).join(" ")}
              </p>
            )}
          </div>

          <div className={styles.radioGroup}>
            <span className={styles.fieldLegend}>이자 방식</span>
            <div className={styles.radioOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="interestType"
                  value="simple"
                  checked={input.interestType === "simple"}
                  onChange={handleInputChange}
                />
                단리
              </label>
            </div>
            <p className={styles.fieldDescription}>
              복리 계산은 1차 범위에 포함하지 않습니다.
            </p>
          </div>

          {numberFields.map(({ name, depositLabel, installmentLabel, unit, description }) => {
            const fieldErrors = errorsByField[name] ?? [];
            const descriptionId = `${name}-description`;
            const errorId = `${name}-error`;
            const label =
              input.productType === "deposit" ? depositLabel : installmentLabel;

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
                    inputMode="decimal"
                    autoComplete="off"
                    value={input[name]}
                    onChange={handleInputChange}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={
                      fieldErrors.length > 0
                        ? `${descriptionId} ${errorId}`
                        : descriptionId
                    }
                  />
                  <span aria-hidden="true">{unit}</span>
                </div>
                <p className={styles.fieldDescription} id={descriptionId}>
                  {description}
                </p>
                {fieldErrors.length > 0 && (
                  <p className={styles.fieldError} id={errorId} role="alert">
                    {fieldErrors.map(getErrorMessage).join(" ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className={styles.storageNotice}>
          입력값은 서버로 전송하지 않고 현재 화면에서만 계산합니다. 자유적금은
          매월 동일 금액 납입 기준으로만 참고할 수 있습니다.
        </p>

        {errors.length > 0 && (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            {result ? "다시 계산하기" : "만기 수령액 계산하기"}
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
          <h2>세후 만기 수령액을 확인하세요</h2>
          <p>예금 또는 정기적금 조건을 입력하면 원금과 이자를 나누어 계산합니다.</p>
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
            aria-labelledby="savings-result-heading"
          >
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>02 · 계산 결과</p>
                <h2 id="savings-result-heading">만기 수령액 요약</h2>
              </div>
              <p>금액은 원 단위 반올림</p>
            </div>

            <dl className={styles.summaryGrid}>
              <div>
                <dt>상품 유형</dt>
                <dd>{getProductLabel(result.productType)}</dd>
              </div>
              <div>
                <dt>{amountLabel}</dt>
                <dd>{formatWon(calculatedInput.amount)}</dd>
              </div>
              <div>
                <dt>기간</dt>
                <dd>{result.termMonths}개월</dd>
              </div>
              <div>
                <dt>원금 합계</dt>
                <dd>{formatWon(result.principalTotal)}</dd>
              </div>
              <div>
                <dt>세전 이자</dt>
                <dd>{formatWon(result.grossInterest)}</dd>
              </div>
              <div>
                <dt>이자소득세</dt>
                <dd>{formatWon(result.incomeTax)}</dd>
              </div>
              <div>
                <dt>지방소득세</dt>
                <dd>{formatWon(result.localIncomeTax)}</dd>
              </div>
              <div>
                <dt>총 세금</dt>
                <dd>{formatWon(result.totalTax)}</dd>
              </div>
              <div>
                <dt>세후 이자</dt>
                <dd>{formatWon(result.netInterest)}</dd>
              </div>
              <div>
                <dt>만기 수령액</dt>
                <dd>{formatWon(result.maturityAmount)}</dd>
              </div>
              <div>
                <dt>적용 세율</dt>
                <dd>{formatPercent(result.appliedTaxRate * 100)}</dd>
              </div>
              <div>
                <dt>과세 방식</dt>
                <dd>{getTaxTypeLabel(result.taxType)}</dd>
              </div>
            </dl>

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
            <p className={styles.actionMessage} aria-live="polite">
              {actionMessage}
            </p>
          </section>

          <section className={styles.summaryCard} aria-labelledby="detail-title">
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>03 · 상세 계산 내역</p>
                <h2 id="detail-title">이자와 세금 흐름</h2>
              </div>
              <p>세전 이자에서 세금을 뺀 금액을 원금에 더합니다.</p>
            </div>

            <dl className={styles.detailGrid}>
              <div>
                <dt>{amountLabel}</dt>
                <dd>{formatWon(calculatedInput.amount)}</dd>
              </div>
              <div>
                <dt>연 이율</dt>
                <dd>{formatPercent(result.annualInterestRate)}</dd>
              </div>
              <div>
                <dt>기간</dt>
                <dd>{result.termMonths}개월</dd>
              </div>
              {result.productType === "installment" && (
                <>
                  <div>
                    <dt>원금 합계</dt>
                    <dd>{formatWon(result.principalTotal)}</dd>
                  </div>
                  <div>
                    <dt>기간 합산값</dt>
                    <dd>{result.installmentInterestMonthSum}</dd>
                  </div>
                </>
              )}
              <div className={styles.formula}>
                <dt>세전 이자 계산식</dt>
                <dd>
                  {result.productType === "deposit"
                    ? "예치금 × 연 이율 × 기간 / 12"
                    : "월 납입액 × 연 이율 / 12 × 기간 × (기간 + 1) / 2"}
                </dd>
              </div>
              <div>
                <dt>세전 이자</dt>
                <dd>{formatWon(result.grossInterest)}</dd>
              </div>
              <div>
                <dt>소득세</dt>
                <dd>{formatWon(result.incomeTax)}</dd>
              </div>
              <div>
                <dt>지방소득세</dt>
                <dd>{formatWon(result.localIncomeTax)}</dd>
              </div>
              <div>
                <dt>세후 이자</dt>
                <dd>{formatWon(result.netInterest)}</dd>
              </div>
              <div>
                <dt>만기 수령액</dt>
                <dd>{formatWon(result.maturityAmount)}</dd>
              </div>
            </dl>
          </section>

          <aside className={styles.notice}>
            <p>
              {result.productType === "deposit"
                ? "예금은 전체 원금이 처음부터 이자를 받는 구조입니다."
                : "정기적금은 매월 납입액마다 이자 발생 기간이 달라 예금과 결과가 다릅니다."}
            </p>
            <p>
              일반 과세 기준 결과이며 실제 지급액은 금융기관 약관, 일수 계산,
              우대금리 충족 여부, 원미만 처리에 따라 달라질 수 있습니다.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateVatProfit,
  MAX_VAT_AMOUNT,
  type VatProfitInput,
  type VatProfitInputField,
  type VatProfitResult,
  type VatProfitValidationError,
} from "@/lib/calculators/vat-profit/vatProfit";
import {
  buildVatProfitResultText,
  formatVatProfitRate,
  formatVatProfitWon,
  initialVatProfitInput,
  parseVatProfitInput,
  type VatProfitRawInputs,
} from "./vatProfitClientUtils";
import styles from "./LaborPayCalculator.module.css";

const labels: Record<VatProfitInputField, string> = {
  amountMode: "입력 기준",
  salesAmount: "매출 금액",
  purchaseVat: "매입세액",
};

function getErrorMessage(error: VatProfitValidationError) {
  const label = labels[error.field];

  switch (error.code) {
    case "REQUIRED":
    case "INVALID_NUMBER":
      return `${label}을 숫자로 입력해 주세요.`;
    case "INVALID_MODE":
      return "입력 기준을 선택해 주세요.";
    case "MUST_BE_POSITIVE":
      return `${label}은 0보다 큰 금액으로 입력해 주세요.`;
    case "MUST_BE_NON_NEGATIVE":
      return `${label}은 0원 이상으로 입력해 주세요.`;
    case "AMOUNT_OUT_OF_RANGE":
      return `${label}은 ${MAX_VAT_AMOUNT.toLocaleString("ko-KR")}원 이하로 입력해 주세요.`;
  }
}

export function VatProfitCalculator() {
  const [input, setInput] = useState<VatProfitRawInputs>(
    initialVatProfitInput,
  );
  const [errors, setErrors] = useState<VatProfitValidationError[]>([]);
  const [result, setResult] = useState<VatProfitResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<VatProfitInput | null>(
    null,
  );
  const [isResultStale, setIsResultStale] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const inputRefs = useRef<Partial<Record<VatProfitInputField, HTMLInputElement>>>(
    {},
  );

  const errorsByField = errors.reduce<
    Partial<Record<VatProfitInputField, VatProfitValidationError[]>>
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
    const field = event.currentTarget.name as keyof VatProfitRawInputs;
    setInput((current) => ({ ...current, [field]: event.currentTarget.value }));
    markStale();
  }

  function handleModeChange(amountMode: VatProfitRawInputs["amountMode"]) {
    setInput((current) => ({ ...current, amountMode }));
    markStale();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseVatProfitInput(input);
    const response = calculateVatProfit(parsed as VatProfitInput);

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
    setCalculatedInput(parsed as VatProfitInput);
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(initialVatProfitInput);
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

    const text = buildVatProfitResultText(calculatedInput, result);

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

    const text = buildVatProfitResultText(calculatedInput, result);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "부가세 계산 결과", text });
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
            <h2>매출과 매입세액 입력</h2>
          </div>
          <p>일반과세자 기본 세율 10% 기준 참고 계산입니다.</p>
        </div>

        <fieldset className={styles.field}>
          <legend className={styles.fieldLegend}>입력 기준</legend>
          <div className={styles.segmented}>
            <button
              className={`${styles.segmentButton} ${
                input.amountMode === "supply" ? styles.segmentButtonActive : ""
              }`}
              type="button"
              onClick={() => handleModeChange("supply")}
              aria-pressed={input.amountMode === "supply"}
            >
              공급가액
            </button>
            <button
              className={`${styles.segmentButton} ${
                input.amountMode === "total" ? styles.segmentButtonActive : ""
              }`}
              type="button"
              onClick={() => handleModeChange("total")}
              aria-pressed={input.amountMode === "total"}
            >
              합계금액
            </button>
          </div>
          {(errorsByField.amountMode ?? []).map((error) => (
            <p className={styles.fieldError} key={error.code} role="alert">
              {getErrorMessage(error)}
            </p>
          ))}
        </fieldset>

        <div className={styles.fieldGrid}>
          {[
            {
              name: "salesAmount" as const,
              label:
                input.amountMode === "supply"
                  ? "매출 공급가액"
                  : "매출 합계금액",
              helper:
                input.amountMode === "supply"
                  ? "부가세를 제외한 공급가액을 입력합니다."
                  : "부가세가 포함된 소비자 결제금액을 입력합니다.",
            },
            {
              name: "purchaseVat" as const,
              label: "공제할 매입세액",
              helper:
                "세금계산서 등으로 확인한 공제 가능 매입세액만 직접 입력합니다.",
            },
          ].map(({ name, label, helper }) => {
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
                    inputMode="numeric"
                    value={input[name]}
                    onChange={handleInputChange}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={
                      fieldErrors.length > 0 ? errorId : undefined
                    }
                  />
                  <span>원</span>
                </div>
                <p className={styles.helper}>{helper}</p>
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
        </div>

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            부가세 계산하기
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
        aria-label="부가세 계산 결과"
        aria-live="polite"
      >
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>Step 2</p>
            <h2>결과 요약</h2>
          </div>
          <p>입력값 기준 참고용 예상값</p>
        </div>

        <div className={styles.resultLive}>
          {!result ? (
            <div className={styles.emptyResult}>
              <span aria-hidden="true">%</span>
              <p>매출 금액과 매입세액을 입력하면 결과가 표시됩니다.</p>
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
                <span className={`${styles.status} ${styles.eligible}`}>
                  {formatVatProfitRate(result.effectiveVatRate)}
                </span>
                <p>예상 납부세액</p>
                <strong>{formatVatProfitWon(result.expectedPayableVat)}</strong>
              </div>

              <dl className={styles.resultList}>
                <div>
                  <dt>공급가액</dt>
                  <dd>{formatVatProfitWon(result.supplyAmount)}</dd>
                </div>
                <div>
                  <dt>매출세액</dt>
                  <dd>{formatVatProfitWon(result.outputVat)}</dd>
                </div>
                <div>
                  <dt>합계금액</dt>
                  <dd>{formatVatProfitWon(result.totalAmount)}</dd>
                </div>
                <div>
                  <dt>입력 매입세액</dt>
                  <dd>{formatVatProfitWon(result.purchaseVat)}</dd>
                </div>
              </dl>

              <dl className={styles.detailList} aria-label="상세 계산 내역">
                {result.formulas.map((formula) => (
                  <div key={formula}>
                    <dt>계산식</dt>
                    <dd>{formula}</dd>
                  </div>
                ))}
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

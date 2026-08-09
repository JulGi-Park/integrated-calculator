"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { calculateBrokerageFee } from "@/lib/calculators/brokerage-fee/brokerage-fee";
import type {
  BrokerageFeeInput,
  BrokerageFeeInputField,
  BrokerageFeeResult,
  BrokerageFeeValidationError,
  BrokerageTransactionType,
} from "@/lib/calculators/brokerage-fee/types";
import {
  BROKERAGE_FEE_STORAGE_KEY,
  buildBrokerageFeeResultText,
  formatBrokerageRate,
  formatBrokerageWon,
  getBrokerageTransactionLabel,
  initialBrokerageFeeInput,
  parseBrokerageFeeStoredInputs,
  serializeBrokerageFeeInputs,
  type BrokerageFeeRawInputs,
} from "./brokerageFeeClientUtils";
import styles from "./BrokerageFeeCalculator.module.css";

interface FieldDefinition {
  name: keyof BrokerageFeeRawInputs;
  label: string;
  unit: "원" | "%";
  description?: string;
  visibleFor: BrokerageTransactionType[];
}

const transactionTypes: BrokerageTransactionType[] = [
  "sale",
  "jeonse",
  "monthlyRent",
];

const fields: FieldDefinition[] = [
  {
    name: "transactionAmount",
    label: "거래금액",
    unit: "원",
    visibleFor: ["sale"],
  },
  {
    name: "jeonseDeposit",
    label: "전세보증금",
    unit: "원",
    visibleFor: ["jeonse"],
  },
  {
    name: "monthlyRentDeposit",
    label: "월세 보증금",
    unit: "원",
    visibleFor: ["monthlyRent"],
    description: "보증금이 없으면 0 입력",
  },
  {
    name: "monthlyRent",
    label: "월세",
    unit: "원",
    visibleFor: ["monthlyRent"],
  },
  {
    name: "negotiatedRatePercent",
    label: "협의요율",
    unit: "%",
    visibleFor: ["sale", "jeonse", "monthlyRent"],
    description: "선택 입력, 적용 상한요율 이하",
  },
];

const labels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Partial<Record<keyof BrokerageFeeRawInputs, string>>;

const rawInputFieldNames = new Set<string>([
  "transactionType",
  "transactionAmount",
  "jeonseDeposit",
  "monthlyRentDeposit",
  "monthlyRent",
  "negotiatedRatePercent",
]);

function parseInput(input: BrokerageFeeRawInputs): Record<string, unknown> {
  return {
    transactionType: input.transactionType,
    transactionAmount:
      input.transactionAmount.trim() === ""
        ? undefined
        : Number(input.transactionAmount),
    jeonseDeposit:
      input.jeonseDeposit.trim() === "" ? undefined : Number(input.jeonseDeposit),
    monthlyRentDeposit:
      input.monthlyRentDeposit.trim() === ""
        ? undefined
        : Number(input.monthlyRentDeposit),
    monthlyRent:
      input.monthlyRent.trim() === "" ? undefined : Number(input.monthlyRent),
    negotiatedRatePercent:
      input.negotiatedRatePercent.trim() === ""
        ? undefined
        : Number(input.negotiatedRatePercent),
  };
}

function getErrorMessage(error: BrokerageFeeValidationError) {
  const label =
    error.field in labels
      ? labels[error.field as keyof BrokerageFeeRawInputs]
      : "입력값";

  switch (error.code) {
    case "INVALID_TRANSACTION_TYPE":
      return "지원하는 거래유형을 선택해 주세요.";
    case "INVALID_NUMBER":
      return `${label}은 숫자로 입력해 주세요.`;
    case "MUST_BE_POSITIVE":
      return `${label}은 0원보다 큰 숫자로 입력해 주세요.`;
    case "MUST_BE_NON_NEGATIVE":
      return `${label}은 0원 이상으로 입력해 주세요.`;
    case "RENT_REQUIRES_VALUE":
      return "월세 거래는 보증금 또는 월세 중 하나 이상을 입력해 주세요.";
    case "TOO_LARGE":
      return `${label}이 너무 큽니다. 입력값을 줄여 주세요.`;
    case "RATE_EXCEEDS_MAX":
      return "협의요율은 적용 상한요율을 넘을 수 없습니다.";
    case "NON_FINITE_RESULT":
      return "계산 결과가 유효하지 않습니다. 입력값을 줄여 주세요.";
  }
}

export function BrokerageFeeCalculator() {
  const [input, setInput] = useState<BrokerageFeeRawInputs>(
    initialBrokerageFeeInput,
  );
  const [errors, setErrors] = useState<BrokerageFeeValidationError[]>([]);
  const [result, setResult] = useState<BrokerageFeeResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<BrokerageFeeInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<
    Partial<Record<BrokerageFeeInputField, HTMLInputElement>>
  >({});

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(
          BROKERAGE_FEE_STORAGE_KEY,
        );

        if (storedValue !== null) {
          const restoredInput = parseBrokerageFeeStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(BROKERAGE_FEE_STORAGE_KEY);
          }
        }
      } catch {
        // Storage is optional; the calculator remains usable.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const visibleFields = fields.filter(({ visibleFor }) =>
    visibleFor.includes(input.transactionType),
  );
  const errorsByField = errors.reduce<
    Partial<Record<BrokerageFeeInputField, BrokerageFeeValidationError[]>>
  >((grouped, error) => {
    if (rawInputFieldNames.has(error.field)) {
      const field = error.field as BrokerageFeeInputField;
      grouped[field] = [...(grouped[field] ?? []), error];
    }

    return grouped;
  }, {});
  const generalErrors = errors.filter(
    (error) => !rawInputFieldNames.has(error.field),
  );

  function persist(nextInput: BrokerageFeeRawInputs) {
    if (!hasRestoredInputs.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        BROKERAGE_FEE_STORAGE_KEY,
        serializeBrokerageFeeInputs(nextInput),
      );
    } catch {
      // Storage failure must not block input or calculation.
    }
  }

  function updateInput(nextInput: BrokerageFeeRawInputs) {
    setInput(nextInput);
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }

    persist(nextInput);
  }

  function handleTransactionTypeChange(transactionType: BrokerageTransactionType) {
    updateInput({ ...input, transactionType });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof BrokerageFeeRawInputs;
    updateInput({ ...input, [field]: event.currentTarget.value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseInput(input);
    const response = calculateBrokerageFee(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);
      setActionMessage("");

      const firstInputError = response.errors.find(
        (error) => error.field in inputRefs.current,
      );

      if (firstInputError) {
        inputRefs.current[
          firstInputError.field as BrokerageFeeInputField
        ]?.focus();
      }

      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as BrokerageFeeInput);
    setIsResultStale(false);
    setActionMessage("");
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(BROKERAGE_FEE_STORAGE_KEY);
    } catch {
      // Reset continues even if storage deletion fails.
    }

    setInput(initialBrokerageFeeInput);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.transactionAmount?.focus();
  }

  async function copyWithFallback(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through to the document-based copy attempt.
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
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
    }
  }

  function getCurrentResultText() {
    if (!result || !calculatedInput || isResultStale || errors.length > 0) {
      return null;
    }

    try {
      return buildBrokerageFeeResultText(calculatedInput, result);
    } catch {
      return null;
    }
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

    if (!text) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    if (typeof navigator.share !== "function") {
      const copied = await copyWithFallback(text);
      setActionMessage(
        copied
          ? "공유 기능을 지원하지 않아 결과를 복사했습니다."
          : "공유 기능을 지원하지 않습니다. 결과 복사를 다시 시도해 주세요.",
      );
      return;
    }

    try {
      const shareData: ShareData = {
        title: "부동산 중개보수 계산 결과",
        text,
      };

      if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        shareData.url = window.location.href;
      }

      await navigator.share(shareData);
      setActionMessage("계산 결과를 공유했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("공유가 취소되었습니다.");
      } else {
        setActionMessage("공유하지 못해 결과 복사를 이용해 주세요.");
      }
    }
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 거래 정보</p>
            <h2>거래유형과 금액을 입력하세요</h2>
          </div>
          <p>주택 기준</p>
        </div>

        <div className={styles.segmentGroup} aria-label="거래유형">
          {transactionTypes.map((transactionType) => (
            <button
              className={
                input.transactionType === transactionType
                  ? styles.activeSegment
                  : undefined
              }
              key={transactionType}
              type="button"
              onClick={() => handleTransactionTypeChange(transactionType)}
            >
              {getBrokerageTransactionLabel(transactionType)}
            </button>
          ))}
        </div>

        <div className={styles.fieldGrid}>
          {visibleFields.map(({ name, label, unit, description }) => {
            const fieldErrors =
              errorsByField[name as BrokerageFeeInputField] ?? [];
            const errorId = `${name}-error`;

            return (
              <div className={styles.field} key={name}>
                <label htmlFor={name}>
                  {label}
                  {name === "negotiatedRatePercent" ? " (선택)" : ""}
                </label>
                <div
                  className={`${styles.inputShell} ${
                    fieldErrors.length > 0 ? styles.inputShellError : ""
                  }`}
                >
                  <input
                    ref={(element) => {
                      if (element) {
                        inputRefs.current[name as BrokerageFeeInputField] = element;
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
                    aria-describedby={
                      fieldErrors.length > 0 ? errorId : undefined
                    }
                  />
                  <span aria-hidden="true">{unit}</span>
                </div>
                {description && <small>{description}</small>}
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
            {generalErrors.map((error) => (
              <span key={`${error.field}-${error.code}`}>
                {getErrorMessage(error)}
              </span>
            ))}
          </div>
        )}

        <p className={styles.notice}>
          결과는 확정 청구액이 아니라 주택 중개보수 상한요율을 기준으로 한
          참고 계산입니다.
        </p>

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            계산하기
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

      <section className={styles.resultCard} aria-labelledby="result-heading">
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>02 · 계산 결과</p>
            <h2 id="result-heading">중개보수 상한액</h2>
          </div>
        </div>

        <div className={styles.resultLive} aria-live="polite">
          {!result && errors.length === 0 && (
            <div className={styles.emptyResult}>
              <span aria-hidden="true">₩</span>
              <p>입력값을 입력한 후 계산해 주세요.</p>
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
                <span className={styles.status}>
                  {getBrokerageTransactionLabel(result.transactionType)}
                </span>
                <p>부가세 별도 상한보수</p>
                <strong>{formatBrokerageWon(result.baseFee)}</strong>
                <span>
                  부가세 포함 예상 {formatBrokerageWon(result.vatIncludedFee)}
                </span>
              </div>

              <dl className={styles.resultList}>
                <div>
                  <dt>적용 거래금액</dt>
                  <dd>{formatBrokerageWon(result.appliedTransactionAmount)}</dd>
                </div>
                <div>
                  <dt>적용 구간</dt>
                  <dd>{result.rateBand.label}</dd>
                </div>
                <div>
                  <dt>상한요율</dt>
                  <dd>{formatBrokerageRate(result.maxRatePercent)}</dd>
                </div>
                <div>
                  <dt>한도액</dt>
                  <dd>
                    {result.limitAmount === null
                      ? "없음"
                      : formatBrokerageWon(result.limitAmount)}
                  </dd>
                </div>
                <div>
                  <dt>부가세</dt>
                  <dd>{formatBrokerageWon(result.vatAmount)}</dd>
                </div>
              </dl>

              {result.transactionType === "monthlyRent" && (
                <>
                  <h3 className={styles.subheading}>월세 환산 거래금액</h3>
                  <dl className={styles.resultList}>
                    <div>
                      <dt>1차 환산 거래금액</dt>
                      <dd>
                        {formatBrokerageWon(
                          result.firstMonthlyRentConvertedAmount ?? 0,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>5천만원 미만 재계산</dt>
                      <dd>{result.monthlyRentRecalculated ? "적용" : "미적용"}</dd>
                    </div>
                    <div>
                      <dt>최종 적용 거래금액</dt>
                      <dd>
                        {formatBrokerageWon(
                          result.finalMonthlyRentConvertedAmount ?? 0,
                        )}
                      </dd>
                    </div>
                  </dl>
                </>
              )}

              {result.negotiatedRatePercent !== null &&
                result.negotiatedFee !== null &&
                result.negotiatedVatIncludedFee !== null && (
                  <>
                    <h3 className={styles.subheading}>협의요율 적용</h3>
                    <dl className={styles.resultList}>
                      <div>
                        <dt>협의요율</dt>
                        <dd>
                          {formatBrokerageRate(result.negotiatedRatePercent)}
                        </dd>
                      </div>
                      <div>
                        <dt>협의보수</dt>
                        <dd>{formatBrokerageWon(result.negotiatedFee)}</dd>
                      </div>
                      <div>
                        <dt>부가세 포함 협의보수</dt>
                        <dd>
                          {formatBrokerageWon(result.negotiatedVatIncludedFee)}
                        </dd>
                      </div>
                      <div>
                        <dt>한도액 적용</dt>
                        <dd>{result.negotiatedLimitApplied ? "적용" : "미적용"}</dd>
                      </div>
                    </dl>
                  </>
                )}

              {!isResultStale && calculatedInput && (
                <div className={styles.resultActions}>
                  <button type="button" onClick={handleCopy}>
                    결과 복사
                  </button>
                  <button type="button" onClick={handleShare}>
                    {isShareSupported ? "공유" : "공유 대체"}
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
  );
}

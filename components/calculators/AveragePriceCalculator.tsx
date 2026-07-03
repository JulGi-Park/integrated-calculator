"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { calculateAveragePrice } from "@/lib/calculators/average-price/average-price";
import type {
  AveragePriceInput,
  AveragePriceInputField,
  AveragePriceResult,
  AveragePriceValidationError,
} from "@/lib/calculators/average-price/types";
import {
  AVERAGE_PRICE_STORAGE_KEY,
  buildAveragePriceResultText,
  formatAveragePriceQuantity,
  formatAveragePriceRate,
  formatAveragePriceWon,
  initialAveragePriceInput,
  parseAveragePriceStoredInputs,
  serializeAveragePriceInputs,
  type AveragePriceRawInputs,
} from "./averagePriceClientUtils";
import styles from "./AveragePriceCalculator.module.css";

interface FieldDefinition {
  name: keyof AveragePriceRawInputs;
  label: string;
  unit: "주/개" | "원";
  optional?: boolean;
  description?: string;
}

const fields: FieldDefinition[] = [
  {
    name: "currentQuantity",
    label: "현재 보유 수량",
    unit: "주/개",
    description: "소수 수량 입력 가능",
  },
  { name: "currentAveragePrice", label: "현재 평균 단가", unit: "원" },
  {
    name: "additionalQuantity",
    label: "추가 매수 수량",
    unit: "주/개",
    description: "코인·해외주식 소수 수량 가능",
  },
  { name: "additionalPrice", label: "추가 매수 단가", unit: "원" },
  {
    name: "targetPrice",
    label: "현재가 또는 목표 매도가",
    unit: "원",
    optional: true,
    description: "입력하면 예상 손익과 수익률을 계산",
  },
];

const labels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<keyof AveragePriceRawInputs, string>;

function parseInput(input: AveragePriceRawInputs): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([field, value]) => [
      field,
      value.trim() === "" ? undefined : Number(value),
    ]),
  );
}

function getErrorMessage(error: AveragePriceValidationError) {
  const label =
    error.field in labels
      ? labels[error.field as keyof AveragePriceRawInputs]
      : "입력값";

  switch (error.code) {
    case "INVALID_NUMBER":
      return `${label}은 숫자로 입력해 주세요.`;
    case "MUST_BE_POSITIVE":
      return `${label}은 0보다 큰 숫자로 입력해 주세요.`;
    case "TOO_LARGE":
      return `${label}이 너무 큽니다. 1조 이하의 값으로 입력해 주세요.`;
    case "NON_FINITE_RESULT":
      return "계산 결과가 유효하지 않습니다. 입력값을 줄여 주세요.";
  }
}

function getResultStatus(result: AveragePriceResult) {
  if (result.expectedProfitLoss === null) {
    return { label: "평균단가 계산", tone: styles.neutral };
  }

  if (result.expectedProfitLoss > 0) {
    return { label: "예상 이익", tone: styles.profit };
  }

  if (result.expectedProfitLoss < 0) {
    return { label: "예상 손실", tone: styles.loss };
  }

  return { label: "손익분기", tone: styles.neutral };
}

export function AveragePriceCalculator() {
  const [input, setInput] = useState<AveragePriceRawInputs>(
    initialAveragePriceInput,
  );
  const [errors, setErrors] = useState<AveragePriceValidationError[]>([]);
  const [result, setResult] = useState<AveragePriceResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<AveragePriceInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<
    Partial<Record<AveragePriceInputField, HTMLInputElement>>
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
          AVERAGE_PRICE_STORAGE_KEY,
        );

        if (storedValue !== null) {
          const restoredInput = parseAveragePriceStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(AVERAGE_PRICE_STORAGE_KEY);
          }
        }
      } catch {
        // Storage is optional; calculation remains available.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const errorsByField = errors.reduce<
    Partial<Record<AveragePriceInputField, AveragePriceValidationError[]>>
  >((grouped, error) => {
    if (error.field in initialAveragePriceInput) {
      const field = error.field as AveragePriceInputField;
      grouped[field] = [...(grouped[field] ?? []), error];
    }

    return grouped;
  }, {});

  const generalErrors = errors.filter(
    (error) => !(error.field in initialAveragePriceInput),
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof AveragePriceRawInputs;
    const nextInput = { ...input, [field]: event.currentTarget.value };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }

    if (hasRestoredInputs.current) {
      try {
        window.localStorage.setItem(
          AVERAGE_PRICE_STORAGE_KEY,
          serializeAveragePriceInputs(nextInput),
        );
      } catch {
        // Storage failure must not block input.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseInput(input);
    const response = calculateAveragePrice(parsedInput);

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
          firstInputError.field as AveragePriceInputField
        ]?.focus();
      }

      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as AveragePriceInput);
    setIsResultStale(false);
    setActionMessage("");
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(AVERAGE_PRICE_STORAGE_KEY);
    } catch {
      // Reset continues even if storage deletion is unavailable.
    }

    setInput(initialAveragePriceInput);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.currentQuantity?.focus();
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
      return buildAveragePriceResultText(calculatedInput, result);
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
        title: "물타기 계산 결과",
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

  const resultStatus = result ? getResultStatus(result) : null;

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 입력</p>
            <h2>보유 수량과 추가 매수 조건</h2>
          </div>
          <p>원화 기준</p>
        </div>

        <div className={styles.fieldGrid}>
          {fields.map(({ name, label, unit, optional, description }) => {
            const fieldErrors = errorsByField[name as AveragePriceInputField] ?? [];
            const errorId = `${name}-error`;

            return (
              <div className={styles.field} key={name}>
                <label htmlFor={name}>
                  {label}
                  {optional ? " (선택)" : ""}
                </label>
                <div
                  className={`${styles.inputShell} ${
                    fieldErrors.length > 0 ? styles.inputShellError : ""
                  }`}
                >
                  <input
                    ref={(element) => {
                      if (element) {
                        inputRefs.current[name as AveragePriceInputField] = element;
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

        <p className={styles.calculationNotice}>
          수수료, 세금, 환율 등은 반영하지 않은 단순 계산값입니다.
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
            <p className={styles.step}>02 · 결과</p>
            <h2 id="result-heading">평균단가와 예상 손익</h2>
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

          {result && resultStatus && (
            <div className={isResultStale ? styles.staleResult : undefined}>
              {isResultStale && (
                <p className={styles.staleNotice} role="status">
                  입력값이 변경되었습니다. 다시 계산해 주세요.
                </p>
              )}

              <div className={styles.primaryResult}>
                <span className={`${styles.status} ${resultStatus.tone}`}>
                  {resultStatus.label}
                </span>
                <p>신규 평균 단가</p>
                <strong>{formatAveragePriceWon(result.newAveragePrice)}</strong>
                <span>
                  총 보유 수량 {formatAveragePriceQuantity(result.totalQuantity)}
                </span>
              </div>

              <dl className={styles.resultList}>
                <div>
                  <dt>총 투자금액</dt>
                  <dd>{formatAveragePriceWon(result.totalInvestmentAmount)}</dd>
                </div>
                <div>
                  <dt>예상 평가금액</dt>
                  <dd>
                    {result.expectedValuationAmount === null
                      ? "현재가 미입력"
                      : formatAveragePriceWon(result.expectedValuationAmount)}
                  </dd>
                </div>
                <div>
                  <dt>예상 손익</dt>
                  <dd>
                    {result.expectedProfitLoss === null
                      ? "현재가 미입력"
                      : formatAveragePriceWon(result.expectedProfitLoss)}
                  </dd>
                </div>
                <div>
                  <dt>예상 수익률</dt>
                  <dd>
                    {result.expectedProfitRate === null
                      ? "현재가 미입력"
                      : formatAveragePriceRate(result.expectedProfitRate)}
                  </dd>
                </div>
              </dl>

              <h3 className={styles.subheading}>상세 계산 내역</h3>
              <dl className={styles.detailList}>
                <div>
                  <dt>기존 투자금액</dt>
                  <dd>{formatAveragePriceWon(result.existingInvestmentAmount)}</dd>
                </div>
                <div>
                  <dt>추가 투자금액</dt>
                  <dd>{formatAveragePriceWon(result.additionalInvestmentAmount)}</dd>
                </div>
                <div>
                  <dt>총 보유 수량</dt>
                  <dd>{formatAveragePriceQuantity(result.totalQuantity)}</dd>
                </div>
              </dl>

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

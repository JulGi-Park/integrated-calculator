"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  calculateSellerMargin,
  type SellerMarginInput,
  type SellerMarginInputField,
  type SellerMarginResult,
  type SellerMarginValidationError,
} from "@/lib/calculators/seller-margin/seller-margin";
import {
  buildSellerMarginResultText,
  formatSellerMarginRate,
  formatSellerMarginWon,
  initialSellerMarginInput,
  parseSellerMarginStoredInputs,
  SELLER_MARGIN_STORAGE_KEY,
  serializeSellerMarginInputs,
  type SellerMarginRawInputs,
} from "./sellerMarginClientUtils";
import styles from "./SellerMarginCalculator.module.css";

interface FieldDefinition {
  name: SellerMarginInputField;
  label: string;
  unit: "원" | "개" | "%";
  inputMode: "numeric" | "decimal";
}

const fields: FieldDefinition[] = [
  { name: "unitPrice", label: "상품 판매단가", unit: "원", inputMode: "decimal" },
  { name: "quantity", label: "판매수량", unit: "개", inputMode: "decimal" },
  {
    name: "sellerDiscount",
    label: "판매자 부담 할인금액",
    unit: "원",
    inputMode: "decimal",
  },
  {
    name: "customerShippingFee",
    label: "고객에게 받은 배송비",
    unit: "원",
    inputMode: "decimal",
  },
  {
    name: "unitProductCost",
    label: "상품 1개당 원가",
    unit: "원",
    inputMode: "decimal",
  },
  {
    name: "platformFeeRate",
    label: "플랫폼 수수료율",
    unit: "%",
    inputMode: "decimal",
  },
  {
    name: "paymentFeeRate",
    label: "결제 수수료율",
    unit: "%",
    inputMode: "decimal",
  },
  {
    name: "sellerShippingCost",
    label: "판매자 부담 배송비",
    unit: "원",
    inputMode: "decimal",
  },
  {
    name: "allocatedAdCost",
    label: "배분 광고비",
    unit: "원",
    inputMode: "decimal",
  },
  { name: "otherCost", label: "기타 비용", unit: "원", inputMode: "decimal" },
];

const labels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<SellerMarginInputField, string>;

function parseInput(input: SellerMarginRawInputs): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([field, value]) => [
      field,
      value.trim() === "" ? undefined : Number(value),
    ]),
  );
}

function getErrorMessage(error: SellerMarginValidationError) {
  const label =
    error.field in labels
      ? labels[error.field as SellerMarginInputField]
      : "입력값";

  switch (error.code) {
    case "INVALID_NUMBER":
      return `${label} 값을 숫자로 입력해 주세요.`;
    case "MUST_BE_POSITIVE":
      return error.field === "quantity"
        ? "판매수량은 1 이상이어야 합니다."
        : "상품 판매단가는 0보다 커야 합니다.";
    case "MUST_BE_INTEGER":
      return error.field === "quantity"
        ? "판매수량은 정수로 입력해 주세요."
        : `${label}은 원 단위 정수로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${label} 값이 안전한 정수 범위를 벗어났습니다.`;
    case "MUST_BE_NON_NEGATIVE":
      return `${label} 값은 0 이상이어야 합니다.`;
    case "AMOUNT_EXCEEDS_LIMIT":
      return `${label}은 10,000,000,000원 이하여야 합니다.`;
    case "QUANTITY_EXCEEDS_LIMIT":
      return "판매수량은 1,000,000개 이하여야 합니다.";
    case "CALCULATION_EXCEEDS_SAFE_RANGE":
      return error.message;
    case "RATE_OUT_OF_RANGE":
      return `${label} 값은 0% 이상 100% 이하여야 합니다.`;
    case "DISCOUNT_EXCEEDS_PRODUCT_SALES":
      return "할인금액은 상품 판매금액보다 클 수 없습니다.";
    case "ZERO_DENOMINATOR":
      return error.field === "paymentAmount"
        ? "결제금액이 0원이 되지 않도록 할인금액이나 배송비를 확인해 주세요."
        : "상품 판매금액이 0원이 되지 않도록 입력값을 확인해 주세요.";
  }
}

function getProfitStatus(netProfit: number) {
  if (netProfit > 0) {
    return { label: "흑자", tone: styles.profit };
  }

  if (netProfit < 0) {
    return { label: "적자", tone: styles.loss };
  }

  return { label: "손익분기", tone: styles.breakEven };
}

export function SellerMarginCalculator() {
  const [input, setInput] = useState<SellerMarginRawInputs>(
    initialSellerMarginInput,
  );
  const [errors, setErrors] = useState<SellerMarginValidationError[]>([]);
  const [result, setResult] = useState<SellerMarginResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<SellerMarginInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<Partial<Record<SellerMarginInputField, HTMLInputElement>>>(
    {},
  );

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(
          SELLER_MARGIN_STORAGE_KEY,
        );

        if (storedValue !== null) {
          const restoredInput = parseSellerMarginStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(SELLER_MARGIN_STORAGE_KEY);
          }
        }
      } catch {
        // Storage access is optional; the calculator remains fully usable.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const errorsByField = errors.reduce<
    Partial<Record<SellerMarginInputField, SellerMarginValidationError[]>>
  >((grouped, error) => {
    if (error.field in initialSellerMarginInput) {
      const field = error.field as SellerMarginInputField;
      grouped[field] = [...(grouped[field] ?? []), error];
    }

    return grouped;
  }, {});

  const generalErrors = errors.filter(
    (error) => !(error.field in initialSellerMarginInput),
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SellerMarginInputField;
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
          SELLER_MARGIN_STORAGE_KEY,
          serializeSellerMarginInputs(nextInput),
        );
      } catch {
        // Storage failure must not block input or calculation.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseInput(input);
    const response = calculateSellerMargin(parsedInput);

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
          firstInputError.field as SellerMarginInputField
        ]?.focus();
      }

      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as SellerMarginInput);
    setIsResultStale(false);
    setActionMessage("");
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(SELLER_MARGIN_STORAGE_KEY);
    } catch {
      // Screen reset continues even if storage deletion is unavailable.
    }

    setInput(initialSellerMarginInput);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.unitPrice?.focus();
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
      return buildSellerMarginResultText(calculatedInput, result);
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
        : "결과를 복사하지 못했습니다. 다시 시도해 주세요.",
    );
  }

  async function handleShare() {
    const text = getCurrentResultText();

    if (!text || typeof navigator.share !== "function") {
      return;
    }

    try {
      const shareData: ShareData = {
        title: "판매자 마진 계산 결과",
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
        setActionMessage("결과를 공유하지 못했습니다.");
      }
    }
  }

  const profitStatus = result
    ? getProfitStatus(result.estimatedNetProfit)
    : null;

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 주문 정보</p>
            <h2>판매 조건을 입력하세요</h2>
          </div>
          <p>주문 1건 기준</p>
        </div>

        <div className={styles.fieldGrid}>
          {fields.map(({ name, label, unit, inputMode }) => {
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
                    aria-describedby={
                      fieldErrors.length > 0 ? errorId : undefined
                    }
                  />
                  <span aria-hidden="true">{unit}</span>
                </div>
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
            <p className={styles.step}>02 · 예상 결과</p>
            <h2 id="result-heading">주문 손익</h2>
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

          {result && profitStatus && (
            <div className={isResultStale ? styles.staleResult : undefined}>
              {isResultStale && (
                <p className={styles.staleNotice} role="status">
                  입력값이 변경되었습니다. 다시 계산해 주세요.
                </p>
              )}

              <div className={styles.primaryResult}>
                <span className={`${styles.status} ${profitStatus.tone}`}>
                  {profitStatus.label}
                </span>
                <p>예상 순이익</p>
                <strong>{formatSellerMarginWon(result.estimatedNetProfit)}</strong>
                <span>
                  순이익률 {formatSellerMarginRate(result.netProfitMarginRate)}
                </span>
              </div>

              <dl className={styles.resultList}>
                <div>
                  <dt>예상 정산금액</dt>
                  <dd>{formatSellerMarginWon(result.estimatedSettlement)}</dd>
                </div>
                <div>
                  <dt>결제금액</dt>
                  <dd>{formatSellerMarginWon(result.paymentAmount)}</dd>
                </div>
                <div>
                  <dt>총비용</dt>
                  <dd>{formatSellerMarginWon(result.totalCosts)}</dd>
                </div>
                <div>
                  <dt>플랫폼 수수료</dt>
                  <dd>{formatSellerMarginWon(result.platformFee)}</dd>
                </div>
                <div>
                  <dt>결제 수수료</dt>
                  <dd>{formatSellerMarginWon(result.paymentFee)}</dd>
                </div>
                <div>
                  <dt>총수수료</dt>
                  <dd>{formatSellerMarginWon(result.totalFees)}</dd>
                </div>
                <div>
                  <dt>원가율</dt>
                  <dd>{formatSellerMarginRate(result.productCostRate)}</dd>
                </div>
                <div>
                  <dt>총수수료율</dt>
                  <dd>{formatSellerMarginRate(result.totalFeeRate)}</dd>
                </div>
              </dl>

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
  );
}

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  calculateRoas,
  type RoasInput,
  type RoasInputField,
  type RoasResult,
  type RoasValidationError,
} from "@/lib/calculators/roas/roas";
import {
  buildRoasResultText,
  formatRoasInputValue,
  formatRoasRate,
  formatRoasWon,
  initialRoasInput,
  parseRoasRawInputs,
  parseRoasStoredInputs,
  ROAS_STORAGE_KEY,
  serializeRoasInputs,
  type RoasRawInputs,
} from "./roasClientUtils";
import roasStyles from "./RoasCalculator.module.css";
import styles from "./SellerMarginCalculator.module.css";

interface FieldDefinition {
  name: RoasInputField;
  label: string;
  unit: "원" | "%";
  required: boolean;
}

const fields: FieldDefinition[] = [
  { name: "adCost", label: "광고비", unit: "원", required: true },
  { name: "adRevenue", label: "광고 매출", unit: "원", required: true },
  { name: "productCost", label: "상품 원가", unit: "원", required: false },
  { name: "otherCost", label: "기타 비용", unit: "원", required: false },
  { name: "targetRoas", label: "목표 ROAS", unit: "%", required: false },
];

const labels = Object.fromEntries(
  fields.map(({ name, label }) => [name, label]),
) as Record<RoasInputField, string>;

function getErrorMessage(error: RoasValidationError) {
  const messages: Record<
    RoasInputField,
    Partial<Record<RoasValidationError["code"], string>>
  > = {
    adCost: {
      REQUIRED: "광고비를 입력해주세요.",
      INVALID_NUMBER: "광고비는 숫자로 입력해주세요.",
      MUST_BE_POSITIVE: "광고비는 0보다 커야 합니다.",
      MUST_BE_NON_NEGATIVE: "광고비는 음수로 입력할 수 없습니다.",
    },
    adRevenue: {
      REQUIRED: "광고 매출을 입력해주세요.",
      INVALID_NUMBER: "광고 매출은 숫자로 입력해주세요.",
      MUST_BE_NON_NEGATIVE: "광고 매출은 음수로 입력할 수 없습니다.",
    },
    productCost: {
      INVALID_NUMBER: "상품 원가는 숫자로 입력해주세요.",
      MUST_BE_NON_NEGATIVE: "상품 원가는 음수로 입력할 수 없습니다.",
    },
    otherCost: {
      INVALID_NUMBER: "기타 비용은 숫자로 입력해주세요.",
      MUST_BE_NON_NEGATIVE: "기타 비용은 음수로 입력할 수 없습니다.",
    },
    targetRoas: {
      INVALID_NUMBER: "목표 ROAS는 숫자로 입력해주세요.",
      MUST_BE_POSITIVE: "목표 ROAS는 0보다 커야 합니다.",
    },
  };

  return messages[error.field][error.code] ?? `${labels[error.field]} 값을 확인해주세요.`;
}

function getTargetLabel(status: RoasResult["targetStatus"]) {
  if (status === "ACHIEVED") {
    return "목표 달성";
  }

  if (status === "MISSED") {
    return "목표 미달";
  }

  return "목표 미입력";
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

export function RoasCalculator() {
  const [input, setInput] = useState<RoasRawInputs>(initialRoasInput);
  const [errors, setErrors] = useState<RoasValidationError[]>([]);
  const [result, setResult] = useState<RoasResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<RoasInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<Partial<Record<RoasInputField, HTMLInputElement>>>({});

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(ROAS_STORAGE_KEY);

        if (storedValue !== null) {
          const restoredInput = parseRoasStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(ROAS_STORAGE_KEY);
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
    Partial<Record<RoasInputField, RoasValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as RoasInputField;
    const value = formatRoasInputValue(event.currentTarget.value);
    const nextInput = { ...input, [field]: value };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }

    if (hasRestoredInputs.current) {
      try {
        window.localStorage.setItem(ROAS_STORAGE_KEY, serializeRoasInputs(nextInput));
      } catch {
        // Storage failure must not block input or calculation.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseRoasRawInputs(input);
    const response = calculateRoas(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);
      setActionMessage("");
      inputRefs.current[response.errors[0]?.field]?.focus();
      return;
    }

    const normalizedInput: RoasInput = {
      adCost: parsedInput.adCost as number,
      adRevenue: parsedInput.adRevenue as number,
      productCost: (parsedInput.productCost as number | undefined) ?? 0,
      otherCost: (parsedInput.otherCost as number | undefined) ?? 0,
      targetRoas: parsedInput.targetRoas as number | undefined,
    };

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(normalizedInput);
    setIsResultStale(false);
    setActionMessage("");
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(ROAS_STORAGE_KEY);
    } catch {
      // Screen reset continues even if storage deletion is unavailable.
    }

    setInput(initialRoasInput);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.adCost?.focus();
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

    return buildRoasResultText(calculatedInput, result);
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
        title: "ROAS 계산 결과",
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

  const profitStatus = result ? getProfitStatus(result.netProfitAfterAd) : null;

  return (
    <div className={`${styles.calculator} ${roasStyles.roasCalculator}`}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 광고 성과</p>
            <h2>광고 성과와 비용을 입력하세요</h2>
          </div>
          <p>기간 합계 기준</p>
        </div>

        <div className={styles.fieldGrid}>
          {fields.map(({ name, label, unit, required }) => {
            const fieldErrors = errorsByField[name] ?? [];
            const errorId = `${name}-error`;

            return (
              <div className={styles.field} key={name}>
                <label htmlFor={name}>
                  {label}
                  {!required ? " (선택)" : ""}
                </label>
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
                    onChange={handleChange}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={fieldErrors.length > 0 ? errorId : undefined}
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
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            계산하기
          </button>
          <button className={styles.resetButton} type="button" onClick={handleReset}>
            다시 계산
          </button>
        </div>
      </form>

      <section className={styles.resultCard} aria-labelledby="roas-result-heading">
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>02 · 계산 결과</p>
            <h2 id="roas-result-heading">ROAS와 손익</h2>
          </div>
        </div>

        <div className={styles.resultLive} aria-live="polite">
          {!result && errors.length === 0 && (
            <div className={styles.emptyResult}>
              <span aria-hidden="true">%</span>
              <p>입력값을 입력한 후 계산해 주세요.</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className={styles.emptyResult}>
              <span aria-hidden="true">!</span>
              <p>광고비는 0보다 커야 ROAS를 계산할 수 있습니다.</p>
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
                <p>ROAS</p>
                <strong>{formatRoasRate(result.roasRate)}</strong>
                <span>목표 비교: {getTargetLabel(result.targetStatus)}</span>
              </div>

              <dl className={styles.resultList}>
                <div>
                  <dt>광고비</dt>
                  <dd>{calculatedInput ? formatRoasWon(calculatedInput.adCost) : "-"}</dd>
                </div>
                <div>
                  <dt>광고 매출</dt>
                  <dd>
                    {calculatedInput ? formatRoasWon(calculatedInput.adRevenue) : "-"}
                  </dd>
                </div>
                <div>
                  <dt>광고비 비중</dt>
                  <dd>{formatRoasRate(result.adCostShareRate)}</dd>
                </div>
                <div>
                  <dt>광고 후 순이익</dt>
                  <dd>{formatRoasWon(result.netProfitAfterAd)}</dd>
                </div>
                <div>
                  <dt>공헌이익률</dt>
                  <dd>{formatRoasRate(result.contributionMarginRate)}</dd>
                </div>
                <div>
                  <dt>손익분기 ROAS</dt>
                  <dd>{formatRoasRate(result.breakEvenRoasRate)}</dd>
                </div>
                <div>
                  <dt>목표 ROAS 달성 여부</dt>
                  <dd>{getTargetLabel(result.targetStatus)}</dd>
                </div>
              </dl>

              <dl className={styles.resultList}>
                <div>
                  <dt>ROAS 계산식</dt>
                  <dd>광고 매출 ÷ 광고비 × 100</dd>
                </div>
                <div>
                  <dt>광고비 비중 계산식</dt>
                  <dd>광고비 ÷ 광고 매출 × 100</dd>
                </div>
                <div>
                  <dt>광고 후 순이익 계산식</dt>
                  <dd>광고 매출 - 상품 원가 - 기타 비용 - 광고비</dd>
                </div>
                <div>
                  <dt>공헌이익률 계산식</dt>
                  <dd>(광고 매출 - 상품 원가 - 기타 비용) ÷ 광고 매출</dd>
                </div>
                <div>
                  <dt>손익분기 ROAS 계산식</dt>
                  <dd>100 ÷ 공헌이익률</dd>
                </div>
                <div>
                  <dt>목표 ROAS와 실제 ROAS 비교</dt>
                  <dd>{getTargetLabel(result.targetStatus)}</dd>
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

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { calculateCardInstallmentFromUnknown } from "@/lib/calculators/card-installment";
import type {
  CardInstallmentInput,
  CardInstallmentInputField,
  CardInstallmentResult,
  CardInstallmentValidationError,
} from "@/lib/calculators/card-installment";
import {
  buildCardInstallmentResultText,
  CARD_INSTALLMENT_STORAGE_KEY,
  formatRate,
  formatWon,
  initialCardInstallmentInputs,
  parseCardInstallmentInputs,
  parseCardInstallmentStoredInputs,
  serializeCardInstallmentInputs,
  type CardInstallmentRawInputs,
} from "./cardInstallmentClientUtils";
import styles from "./CardInstallmentCalculator.module.css";

const INITIAL_VISIBLE_INSTALLMENTS = 12;
const VISIBLE_INSTALLMENT_STEP = 12;

const fields: Array<{
  name: CardInstallmentInputField;
  label: string;
  unit: string;
  inputMode: "numeric" | "decimal";
  description: string;
}> = [
  {
    name: "purchaseAmount",
    label: "구매금액",
    unit: "원",
    inputMode: "numeric",
    description: "1원 이상 10억원 이하, 원 단위 정수로 입력합니다.",
  },
  {
    name: "installmentMonths",
    label: "할부 개월 수",
    unit: "개월",
    inputMode: "numeric",
    description: "1개월부터 60개월까지 정수로 입력합니다.",
  },
  {
    name: "annualFeeRatePercent",
    label: "연 할부 수수료율",
    unit: "%",
    inputMode: "decimal",
    description: "0%는 무이자 할부로 계산하며 최대 30%까지 지원합니다.",
  },
];

function formatAmountInput(value: string): string {
  const normalized = value.replaceAll(",", "");

  if (!/^-?\d+$/.test(normalized)) {
    return value;
  }

  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function getErrorMessage(error: CardInstallmentValidationError): string {
  const fieldLabel = fields.find(({ name }) => name === error.field)?.label;

  switch (error.code) {
    case "REQUIRED":
      return `${fieldLabel}을 입력해 주세요.`;
    case "INVALID_NUMBER":
      return `${fieldLabel}을 유한한 숫자로 입력해 주세요.`;
    case "MUST_BE_SAFE_INTEGER":
      return `${fieldLabel}이 안전한 정수 범위를 벗어났습니다.`;
    case "MUST_BE_POSITIVE":
      return `${fieldLabel}은 1 이상이어야 합니다.`;
    case "MUST_BE_NON_NEGATIVE":
      return "연 할부 수수료율은 0% 이상이어야 합니다.";
    case "MUST_BE_INTEGER":
      return `${fieldLabel}은 정수로 입력해 주세요.`;
    case "AMOUNT_EXCEEDS_LIMIT":
      return "구매금액은 1,000,000,000원 이하여야 합니다.";
    case "MONTHS_EXCEEDS_LIMIT":
      return "할부 개월 수는 60개월 이하여야 합니다.";
    case "RATE_EXCEEDS_LIMIT":
      return "연 할부 수수료율은 30% 이하여야 합니다.";
  }
}

function ScheduleRow({
  item,
}: {
  item: CardInstallmentResult["schedule"][number];
}) {
  return (
    <tr>
      <th scope="row">{item.installmentNumber}</th>
      <td>{formatWon(item.openingBalance)}</td>
      <td>{formatWon(item.principalPayment)}</td>
      <td>{formatWon(item.fee)}</td>
      <td>{formatWon(item.monthlyPayment)}</td>
      <td>{formatWon(item.closingBalance)}</td>
    </tr>
  );
}

export function CardInstallmentCalculator() {
  const [input, setInput] = useState<CardInstallmentRawInputs>(
    initialCardInstallmentInputs,
  );
  const [errors, setErrors] = useState<CardInstallmentValidationError[]>([]);
  const [result, setResult] = useState<CardInstallmentResult | null>(null);
  const [calculatedInput, setCalculatedInput] =
    useState<CardInstallmentInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [visibleInstallments, setVisibleInstallments] = useState(
    INITIAL_VISIBLE_INSTALLMENTS,
  );
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const inputRefs = useRef<
    Partial<Record<CardInstallmentInputField, HTMLInputElement>>
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
          CARD_INSTALLMENT_STORAGE_KEY,
        );

        if (storedValue !== null) {
          const restoredInput = parseCardInstallmentStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          } else {
            window.localStorage.removeItem(CARD_INSTALLMENT_STORAGE_KEY);
          }
        }
      } catch {
        // Storage access is optional; calculation remains available.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const errorsByField = errors.reduce<
    Partial<Record<CardInstallmentInputField, CardInstallmentValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as CardInstallmentInputField;
    const rawValue = event.currentTarget.value;
    const value =
      field === "purchaseAmount" ? formatAmountInput(rawValue) : rawValue;
    const nextInput = {
      ...input,
      [field]: value,
    };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");

    if (result) {
      setIsResultStale(true);
    }

    if (hasRestoredInputs.current) {
      try {
        window.localStorage.setItem(
          CARD_INSTALLMENT_STORAGE_KEY,
          serializeCardInstallmentInputs(nextInput),
        );
      } catch {
        // Storage failure must not block input or calculation.
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    const parsedInput = parseCardInstallmentInputs(input);
    const response = calculateCardInstallmentFromUnknown(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);
      setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);

      const firstErrorField = fields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      inputRefs.current[firstErrorField?.name ?? "purchaseAmount"]?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as CardInstallmentInput);
    setIsResultStale(false);
    setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(CARD_INSTALLMENT_STORAGE_KEY);
    } catch {
      // Screen reset continues even if storage deletion is unavailable.
    }

    setInput(initialCardInstallmentInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setVisibleInstallments(INITIAL_VISIBLE_INSTALLMENTS);
    setActionMessage("");
    inputRefs.current.purchaseAmount?.focus();
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

    try {
      return buildCardInstallmentResultText(calculatedInput, result);
    } catch {
      return null;
    }
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
        title: "카드 할부 계산 결과",
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
        setActionMessage(
          "결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.",
        );
      }
    }
  }

  const visibleSchedule = result?.schedule.slice(0, visibleInstallments);
  const hasMoreSchedule =
    result !== null && visibleInstallments < result.schedule.length;
  const firstFee = result?.schedule[0]?.fee ?? 0;
  const lastFee = result?.schedule.at(-1)?.fee ?? 0;

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 할부 조건</p>
            <h2>결제 조건을 입력하세요</h2>
          </div>
          <p>월별 잔여 원금 기준 예상 계산</p>
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

        <p className={styles.storageNotice}>
          입력값은 서버로 전송하지 않고 현재 브라우저에 저장됩니다.
        </p>

        {errors.length > 0 && (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            카드 할부 계산하기
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

      {!result && (
        <section className={styles.emptyCard} aria-live="polite">
          <span aria-hidden="true">%</span>
          <h2>할부 수수료를 추정해 보세요</h2>
          <p>
            구매금액, 개월 수, 연 수수료율을 입력하면 월별 예상 납부액을
            보여드립니다.
          </p>
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
            aria-labelledby="card-installment-result-heading"
          >
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>02 · 결과 요약</p>
                <h2 id="card-installment-result-heading">
                  카드 할부 계산 결과
                </h2>
              </div>
              <p>확정 청구금액이 아닌 예상값</p>
            </div>

            <div className={styles.resultLive} aria-live="polite">
              <dl className={styles.summaryGrid}>
                <div>
                  <dt>구매금액</dt>
                  <dd>{formatWon(calculatedInput.purchaseAmount)}</dd>
                </div>
                <div>
                  <dt>할부 개월 수</dt>
                  <dd>{calculatedInput.installmentMonths}개월</dd>
                </div>
                <div>
                  <dt>연 수수료율</dt>
                  <dd>{formatRate(calculatedInput.annualFeeRatePercent)}</dd>
                </div>
                <div>
                  <dt>월 기본 원금</dt>
                  <dd>{formatWon(result.baseMonthlyPrincipal)}</dd>
                </div>
                <div>
                  <dt>총 수수료</dt>
                  <dd>{formatWon(result.totalFee)}</dd>
                </div>
                <div>
                  <dt>총 납부액</dt>
                  <dd>{formatWon(result.totalPayment)}</dd>
                </div>
              </dl>

              <div className={styles.interpretation}>
                <strong>
                  일시불 대비 추가 부담액은{" "}
                  {formatWon(result.extraCostComparedWithLumpSum)}입니다.
                </strong>
                <p>
                  첫 회차 수수료는 {formatWon(firstFee)}, 마지막 회차
                  수수료는 {formatWon(lastFee)}로 잔여 원금이 줄수록
                  수수료도 줄어드는 단순 추정 방식입니다.
                </p>
              </div>

              {!isResultStale && (
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
          </section>

          <section
            className={styles.scheduleSection}
            aria-labelledby="card-installment-schedule-heading"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.step}>03 · 월별 상세</p>
                <h2 id="card-installment-schedule-heading">
                  월별 할부 계산 내역
                </h2>
              </div>
              <p>
                월 수수료율 {formatRate(result.monthlyFeeRate * 100)} 적용
              </p>
            </div>

            <div
              className={styles.tableScroller}
              role="region"
              aria-label="카드 할부 월별 계산 내역 표. 가로로 스크롤할 수 있습니다."
              tabIndex={0}
            >
              <table>
                <caption>카드 할부 월별 계산 내역</caption>
                <thead>
                  <tr>
                    <th scope="col">회차</th>
                    <th scope="col">시작 잔여 원금</th>
                    <th scope="col">납입 원금</th>
                    <th scope="col">할부 수수료</th>
                    <th scope="col">월 납부액</th>
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
                전체 {result.schedule.length}회차 중{" "}
                {visibleSchedule?.length}회차 표시
              </p>
              {hasMoreSchedule && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleInstallments((current) =>
                      Math.min(
                        current + VISIBLE_INSTALLMENT_STEP,
                        result.schedule.length,
                      ),
                    )
                  }
                >
                  다음 {Math.min(
                    VISIBLE_INSTALLMENT_STEP,
                    result.schedule.length - visibleInstallments,
                  )}
                  회차 더 보기
                </button>
              )}
            </div>
          </section>

          <aside className={styles.notice}>
            <p>
              이 결과는 사용자가 입력한 연 수수료율 기준의 단순 추정치입니다.
              실제 카드사 청구금액처럼 해석하지 마세요.
            </p>
            <p>
              무이자, 부분 무이자, 청구 할인, 포인트 사용, 선결제,
              중도상환, 연체이자는 기본 계산에서 제외합니다.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  calculateYouthFutureSavings,
  type YouthFutureSavingsInput,
  type YouthFutureSavingsInputField,
  type YouthFutureSavingsResult,
  type YouthFutureSavingsValidationError,
} from "@/lib/calculators/youth-future-savings";
import {
  buildYouthFutureSavingsResultText,
  formatNumericInput,
  formatPercent,
  formatWon,
  initialYouthFutureSavingsInputs,
  parseYouthFutureSavingsInputs,
  parseYouthFutureSavingsStoredInputs,
  serializeYouthFutureSavingsInputs,
  YOUTH_FUTURE_SAVINGS_STORAGE_KEY,
  type YouthFutureSavingsRawInputs,
} from "./youthFutureSavingsClientUtils";
import styles from "./YouthFutureSavingsCalculator.module.css";

const contributionOptions: Array<{
  value: YouthFutureSavingsInput["contributionType"];
  label: string;
  description: string;
}> = [
  { value: "standard", label: "일반형 6%", description: "납입 원금 기준" },
  { value: "preferred", label: "우대형 12%", description: "납입 원금 기준" },
  { value: "customRate", label: "비율 직접 입력", description: "납입 원금 기준" },
  { value: "customMonthly", label: "월 금액 직접 입력", description: "월 예상액 기준" },
];

const taxOptions: Array<{
  value: YouthFutureSavingsInput["taxType"];
  label: string;
  description: string;
}> = [
  { value: "taxFree", label: "비과세", description: "이자세 0원 가정" },
  { value: "taxable", label: "일반과세", description: "이자소득세 15.4%" },
];

const inputFields: Array<{
  name: Extract<
    YouthFutureSavingsInputField,
    "monthlyDeposit" | "termMonths" | "annualInterestRate"
  >;
  label: string;
  unit: string;
  inputMode: "numeric" | "decimal";
  description: string;
}> = [
  {
    name: "monthlyDeposit",
    label: "월 납입액",
    unit: "원",
    inputMode: "numeric",
    description: "최대 50만원까지 계산합니다.",
  },
  {
    name: "termMonths",
    label: "가입 기간",
    unit: "개월",
    inputMode: "numeric",
    description: "공식 3년 만기 기준으로 최대 36개월입니다.",
  },
  {
    name: "annualInterestRate",
    label: "연 이자율",
    unit: "%",
    inputMode: "decimal",
    description: "은행 기본금리와 우대금리를 합산해 입력하세요.",
  },
];

function getFieldErrors(
  errors: YouthFutureSavingsValidationError[],
  field: YouthFutureSavingsInputField,
) {
  return errors.filter((error) => error.field === field);
}

async function copyWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to document fallback.
  }

  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
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

export function YouthFutureSavingsCalculator() {
  const [input, setInput] = useState<YouthFutureSavingsRawInputs>(
    initialYouthFutureSavingsInputs,
  );
  const [errors, setErrors] = useState<YouthFutureSavingsValidationError[]>([]);
  const [result, setResult] = useState<YouthFutureSavingsResult | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const monthlyDepositRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(
          YOUTH_FUTURE_SAVINGS_STORAGE_KEY,
        );

        if (storedValue) {
          const restoredInput =
            parseYouthFutureSavingsStoredInputs(storedValue);

          if (restoredInput) {
            setInput(restoredInput);
          }
        }
      } catch {
        // Storage is optional.
      } finally {
        hasRestoredInputs.current = true;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  function persist(nextInput: YouthFutureSavingsRawInputs) {
    if (!hasRestoredInputs.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        YOUTH_FUTURE_SAVINGS_STORAGE_KEY,
        serializeYouthFutureSavingsInputs(nextInput),
      );
    } catch {
      // Calculation remains available without storage.
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof YouthFutureSavingsRawInputs;
    const rawValue = event.currentTarget.value;
    const value =
      field === "monthlyDeposit" || field === "customMonthlyContribution"
        ? formatNumericInput(rawValue)
        : rawValue;
    const nextInput = { ...input, [field]: value };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as
      | "contributionType"
      | "taxType";
    const nextInput = { ...input, [field]: event.currentTarget.value };

    setInput(nextInput as YouthFutureSavingsRawInputs);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput as YouthFutureSavingsRawInputs);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    const response = calculateYouthFutureSavings(
      parseYouthFutureSavingsInputs(input),
    );

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setIsResultStale(false);
      monthlyDepositRef.current?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setIsResultStale(false);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(YOUTH_FUTURE_SAVINGS_STORAGE_KEY);
    } catch {
      // Reset continues without storage access.
    }

    setInput(initialYouthFutureSavingsInputs);
    setErrors([]);
    setResult(null);
    setIsResultStale(false);
    setActionMessage("");
    monthlyDepositRef.current?.focus();
  }

  async function handleCopy() {
    if (!result || isResultStale) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    const copied = await copyWithFallback(
      buildYouthFutureSavingsResultText(result),
    );
    setActionMessage(
      copied
        ? "계산 결과를 복사했습니다."
        : "결과를 복사하지 못했습니다. 다시 시도해 주세요.",
    );
  }

  async function handleShare() {
    if (!result || isResultStale || typeof navigator.share !== "function") {
      await handleCopy();
      return;
    }

    try {
      const shareData: ShareData = {
        title: "청년미래적금 계산 결과",
        text: buildYouthFutureSavingsResultText(result),
      };

      if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        shareData.url = window.location.href;
      }

      await navigator.share(shareData);
      setActionMessage("계산 결과를 공유했습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("");
      } else {
        setActionMessage("공유하지 못했습니다. 결과 복사를 이용해 주세요.");
      }
    }
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 입력</p>
            <h2>예상 조건을 입력하세요</h2>
          </div>
          <p>3년 만기 기준</p>
        </div>

        <div className={styles.fieldGrid}>
          {inputFields.map(({ name, label, unit, inputMode, description }, index) => {
            const fieldErrors = getFieldErrors(errors, name);
            const describedBy = `${name}-description${
              fieldErrors.length > 0 ? ` ${name}-error` : ""
            }`;

            return (
              <div className={styles.field} key={name}>
                <label htmlFor={name}>{label}</label>
                <div
                  className={`${styles.inputShell} ${
                    fieldErrors.length > 0 ? styles.inputShellError : ""
                  }`}
                >
                  <input
                    ref={index === 0 ? monthlyDepositRef : undefined}
                    id={name}
                    name={name}
                    type="text"
                    inputMode={inputMode}
                    autoComplete="off"
                    value={input[name]}
                    onChange={handleInputChange}
                    aria-invalid={fieldErrors.length > 0}
                    aria-describedby={describedBy}
                  />
                  <span aria-hidden="true">{unit}</span>
                </div>
                <p className={styles.fieldDescription} id={`${name}-description`}>
                  {description}
                </p>
                {fieldErrors.length > 0 && (
                  <p className={styles.fieldError} id={`${name}-error`}>
                    {fieldErrors.map((error) => error.message).join(" ")}
                  </p>
                )}
              </div>
            );
          })}

          <fieldset className={styles.radioGroup}>
            <legend>정부기여금 방식</legend>
            <div className={styles.radioGrid}>
              {contributionOptions.map((option) => (
                <label className={styles.radioCard} key={option.value}>
                  <input
                    type="radio"
                    name="contributionType"
                    value={option.value}
                    checked={input.contributionType === option.value}
                    onChange={handleRadioChange}
                  />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </fieldset>

          {input.contributionType === "customRate" && (
            <div className={styles.field}>
              <label htmlFor="customContributionRate">정부기여금 비율</label>
              <div className={styles.inputShell}>
                <input
                  id="customContributionRate"
                  name="customContributionRate"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={input.customContributionRate}
                  onChange={handleInputChange}
                />
                <span aria-hidden="true">%</span>
              </div>
              {getFieldErrors(errors, "customContributionRate").map((error) => (
                <p className={styles.fieldError} key={error.code}>
                  {error.message}
                </p>
              ))}
            </div>
          )}

          {input.contributionType === "customMonthly" && (
            <div className={styles.field}>
              <label htmlFor="customMonthlyContribution">월 정부기여금 예상액</label>
              <div className={styles.inputShell}>
                <input
                  id="customMonthlyContribution"
                  name="customMonthlyContribution"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={input.customMonthlyContribution}
                  onChange={handleInputChange}
                />
                <span aria-hidden="true">원</span>
              </div>
              {getFieldErrors(errors, "customMonthlyContribution").map((error) => (
                <p className={styles.fieldError} key={error.code}>
                  {error.message}
                </p>
              ))}
            </div>
          )}

          <fieldset className={styles.radioGroup}>
            <legend>과세 여부</legend>
            <div className={styles.radioGrid}>
              {taxOptions.map((option) => (
                <label className={styles.radioCard} key={option.value}>
                  <input
                    type="radio"
                    name="taxType"
                    value={option.value}
                    checked={input.taxType === option.value}
                    onChange={handleRadioChange}
                  />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {errors.length > 0 && (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryButton} type="submit">
            만기수령액 계산
          </button>
          <button className={styles.secondaryButton} type="button" onClick={handleReset}>
            다시 계산
          </button>
        </div>
      </form>

      <section className={styles.resultCard} aria-labelledby="youth-result-heading">
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>02 · 결과</p>
            <h2 id="youth-result-heading">예상 만기수령액</h2>
          </div>
          <p>단순 예상치</p>
        </div>

        {!result && (
          <div className={styles.emptyResult} aria-live="polite">
            <strong aria-hidden="true">₩</strong>
            <p>조건을 입력하면 예상 수령액과 세부 금액을 보여드립니다.</p>
          </div>
        )}

        {result && (
          <div aria-live="polite">
            {isResultStale && (
              <p className={styles.staleNotice}>입력값이 변경되었습니다. 다시 계산해 주세요.</p>
            )}
            <p className={styles.summaryValue}>{formatWon(result.maturityAmount)}</p>
            <dl className={styles.summaryGrid}>
              <div>
                <dt>총 납입 원금</dt>
                <dd>{formatWon(result.totalPrincipal)}</dd>
              </div>
              <div>
                <dt>정부기여금 합계</dt>
                <dd>{formatWon(result.governmentContribution)}</dd>
              </div>
              <div>
                <dt>예상 세전 이자</dt>
                <dd>{formatWon(result.grossInterest)}</dd>
              </div>
              <div>
                <dt>월평균 적립 효과</dt>
                <dd>{formatWon(result.averageMonthlyBenefit)}</dd>
              </div>
            </dl>
            <dl className={styles.detailGrid}>
              <div>
                <dt>예상 이자세</dt>
                <dd>{formatWon(result.interestTax)}</dd>
              </div>
              <div>
                <dt>비과세 절감액</dt>
                <dd>{formatWon(result.taxSaving)}</dd>
              </div>
              <div>
                <dt>적용 기여금 비율</dt>
                <dd>{formatPercent(result.effectiveContributionRate)}</dd>
              </div>
            </dl>
            <p className={styles.notice}>
              단순 예상치이며 실제 상품 조건, 은행 금리, 납입일, 중도해지,
              우대조건에 따라 달라질 수 있습니다.
            </p>
            <div className={styles.resultActions}>
              <button className={styles.secondaryButton} type="button" onClick={handleCopy}>
                결과 복사
              </button>
              <button className={styles.secondaryButton} type="button" onClick={handleShare}>
                {isShareSupported ? "공유" : "복사로 공유"}
              </button>
            </div>
            <p className={styles.actionMessage} aria-live="polite">
              {actionMessage}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  calculateDsr,
  type DsrCalculationResult,
  type DsrInput,
  type DsrInputField,
  type DsrValidationError,
} from "@/lib/calculators/dsr";
import {
  buildDsrResultText,
  DSR_STORAGE_KEY,
  formatNumericInput,
  formatMultiplier,
  formatPercentPoint,
  formatRate,
  formatWon,
  initialDsrInputs,
  parseDsrInputs,
  parseDsrStoredInputs,
  serializeDsrInputs,
  type DsrRawInputs,
} from "./dsrClientUtils";
import styles from "./DsrCalculator.module.css";

const repaymentOptions: Array<{
  value: DsrInput["repaymentType"];
  label: string;
  description: string;
}> = [
  {
    value: "levelPayment",
    label: "원리금균등",
    description: "월 상환액 일정",
  },
  {
    value: "equalPrincipal",
    label: "원금균등",
    description: "첫 달과 평균 구분",
  },
  {
    value: "partialInstallment",
    label: "일부 분할",
    description: "일부 원금은 만기상환",
  },
  {
    value: "bullet",
    label: "만기일시",
    description: "원금도 산정만기로 나눔",
  },
];

const loanOptions: Array<{ value: DsrInput["loanType"]; label: string }> = [
  { value: "mortgage", label: "주택담보대출" },
  { value: "credit", label: "신용대출" },
  { value: "officetelMortgage", label: "오피스텔담보대출" },
  { value: "nonHousingMortgage", label: "기타 비주택담보대출" },
  { value: "leaseDepositSecured", label: "전세보증금담보대출" },
];

const inputFields: Array<{
  name: Exclude<
    DsrInputField,
    | "loanType"
    | "repaymentType"
    | "creditRepaymentFrequency"
    | "regionType"
    | "isRegulatedArea"
    | "interestRateType"
  >;
  label: string;
  unit: string;
  inputMode: "numeric" | "decimal";
  description: string;
  isAmount?: boolean;
}> = [
  {
    name: "annualIncome",
    label: "연소득",
    unit: "원",
    inputMode: "numeric",
    description: "소득 인정 방식은 금융기관 심사 기준과 다를 수 있습니다.",
    isAmount: true,
  },
  {
    name: "existingAnnualDebtPayment",
    label: "기존 대출 연간 DSR 원리금",
    unit: "원",
    inputMode: "numeric",
    description: "기존 대출별 DSR 산정 연간 원리금 합계를 입력합니다. 없으면 0원입니다.",
    isAmount: true,
  },
  {
    name: "newLoanPrincipal",
    label: "신규 대출 금액",
    unit: "원",
    inputMode: "numeric",
    description: "새로 받을 대출 원금을 입력합니다.",
    isAmount: true,
  },
  {
    name: "annualInterestRate",
    label: "신규 대출 연 금리",
    unit: "%",
    inputMode: "decimal",
    description: "0% 이상 입력할 수 있습니다.",
  },
  {
    name: "termMonths",
    label: "신규 대출 기간",
    unit: "개월",
    inputMode: "numeric",
    description: "정수 개월로 입력합니다. 30년은 360개월입니다.",
  },
  {
    name: "gracePeriodMonths",
    label: "거치기간",
    unit: "개월",
    inputMode: "numeric",
    description: "원금 상환을 미루는 기간입니다. 없으면 0개월입니다.",
  },
  {
    name: "balloonPrincipal",
    label: "만기상환 원금",
    unit: "원",
    inputMode: "numeric",
    description: "일부 분할상환에서 만기에 남겨 두는 원금입니다.",
    isAmount: true,
  },
  {
    name: "creditInstallmentRatio",
    label: "분할상환 비율",
    unit: "%",
    inputMode: "decimal",
    description: "신용대출 총액 중 약정기간에 나누어 갚는 비율입니다.",
  },
  {
    name: "creditLoanTotalBalance",
    label: "전체 신용대출 잔액",
    unit: "원",
    inputMode: "numeric",
    description: "기존 신용대출과 이번 신규 신용대출을 합친 판정 대상 잔액을 입력합니다.",
    isAmount: true,
  },
  {
    name: "fixedRatePeriodMonths",
    label: "고정금리 적용기간",
    unit: "개월",
    inputMode: "numeric",
    description: "혼합형에서 고정금리가 유지되는 기간입니다. 5년은 60개월입니다.",
  },
  {
    name: "rateResetPeriodMonths",
    label: "금리변동주기",
    unit: "개월",
    inputMode: "numeric",
    description: "주기형에서 금리가 다시 정해지는 주기입니다. 5년은 60개월입니다.",
  },
  {
    name: "stressInterestRate",
    label: "금리상승 시나리오",
    unit: "%p",
    inputMode: "decimal",
    description: "사용자 비교 시나리오에서 신규 대출 금리에 더합니다. 공식 정책 자동값이 아닙니다.",
  },
  {
    name: "dsrLimitRate",
    label: "DSR 기준 비율",
    unit: "%",
    inputMode: "decimal",
    description: "예: 40, 50, 60 등 직접 입력할 수 있습니다.",
  },
];

function getFieldErrors(
  errors: DsrValidationError[],
  field: DsrInputField,
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

  const textarea = document.createElement("textarea");
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
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

export function DsrCalculator() {
  const [input, setInput] = useState<DsrRawInputs>(initialDsrInputs);
  const [errors, setErrors] = useState<DsrValidationError[]>([]);
  const [result, setResult] = useState<DsrCalculationResult | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported, setIsShareSupported] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const hasRestoredInputs = useRef(false);
  const annualIncomeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsShareSupported(typeof navigator.share === "function");

      try {
        const storedValue = window.localStorage.getItem(DSR_STORAGE_KEY);

        if (storedValue) {
          const restoredInput = parseDsrStoredInputs(storedValue);

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

  function persist(nextInput: DsrRawInputs) {
    if (!hasRestoredInputs.current) {
      return;
    }

    try {
      window.localStorage.setItem(DSR_STORAGE_KEY, serializeDsrInputs(nextInput));
    } catch {
      // Calculation remains available without storage.
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof DsrRawInputs;
    const rawValue = event.currentTarget.value;
    const config = inputFields.find((item) => item.name === field);
    const value = config?.isAmount ? formatNumericInput(rawValue) : rawValue;
    const nextInput = { ...input, [field]: value };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleRepaymentChange(event: ChangeEvent<HTMLInputElement>) {
    const nextInput = {
      ...input,
      repaymentType: event.currentTarget.value as DsrInput["repaymentType"],
    };

    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const field = event.currentTarget.name as
      | "loanType"
      | "creditRepaymentFrequency"
      | "regionType"
      | "isRegulatedArea"
      | "interestRateType";
    const nextInput = { ...input, [field]: event.currentTarget.value } as DsrRawInputs;
    setInput(nextInput);
    setErrors([]);
    setActionMessage("");
    setIsResultStale(result !== null);
    persist(nextInput);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("");
    const response = calculateDsr(parseDsrInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setIsResultStale(false);
      annualIncomeRef.current?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setIsResultStale(false);
  }

  function handleReset() {
    try {
      window.localStorage.removeItem(DSR_STORAGE_KEY);
    } catch {
      // Reset continues without storage access.
    }

    setInput(initialDsrInputs);
    setErrors([]);
    setResult(null);
    setIsResultStale(false);
    setActionMessage("");
    annualIncomeRef.current?.focus();
  }

  async function handleCopy() {
    if (!result || isResultStale) {
      setActionMessage("최신 계산 결과가 없습니다. 다시 계산해 주세요.");
      return;
    }

    const copied = await copyWithFallback(buildDsrResultText(result));
    setActionMessage(
      copied
        ? "계산 결과를 복사했습니다."
        : "결과를 복사하지 못했습니다. 수동으로 선택해 복사해 주세요.",
    );
  }

  async function handleShare() {
    if (!result || isResultStale || typeof navigator.share !== "function") {
      await handleCopy();
      return;
    }

    try {
      const shareData: ShareData = {
        title: "DSR 계산 결과",
        text: buildDsrResultText(result),
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
            <h2>소득과 대출 조건을 입력하세요</h2>
          </div>
          <p className={styles.muted}>예상 계산용</p>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="loanType">신규 대출 종류</label>
            <div className={styles.selectShell}>
              <select id="loanType" name="loanType" value={input.loanType} onChange={handleSelectChange}>
                {loanOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <p className={styles.fieldDescription}>대출 종류에 따라 공식 DSR 원금 산정만기가 달라집니다.</p>
          </div>

          {(input.loanType === "mortgage" || input.loanType === "officetelMortgage") && (
            <>
              <div className={styles.field}>
                <label htmlFor="regionType">담보물 지역</label>
                <div className={styles.selectShell}>
                  <select id="regionType" name="regionType" value={input.regionType} onChange={handleSelectChange}>
                    <option value="capital">수도권</option>
                    <option value="local">지방</option>
                  </select>
                </div>
                <p className={styles.fieldDescription}>수도권은 서울·경기·인천을 뜻합니다.</p>
              </div>

              {input.regionType === "local" && (
                <div className={styles.field}>
                  <label htmlFor="isRegulatedArea">규제지역 여부</label>
                  <div className={styles.selectShell}>
                    <select id="isRegulatedArea" name="isRegulatedArea" value={input.isRegulatedArea} onChange={handleSelectChange}>
                      <option value="no">비규제지역</option>
                      <option value="yes">규제지역</option>
                    </select>
                  </div>
                  <p className={styles.fieldDescription}>지방이라도 규제지역이면 수도권과 같은 강화 기준을 적용합니다.</p>
                </div>
              )}
            </>
          )}

          <div className={styles.field}>
            <label htmlFor="interestRateType">금리 유형</label>
            <div className={styles.selectShell}>
              <select id="interestRateType" name="interestRateType" value={input.interestRateType} onChange={handleSelectChange}>
                <option value="variable">변동형</option>
                <option value="mixed">혼합형</option>
                <option value="periodic">주기형</option>
                <option value="fixed">완전 고정형</option>
              </select>
            </div>
            <p className={styles.fieldDescription}>금리변동 위험에 따라 공식 스트레스 금리 적용비율이 달라집니다.</p>
          </div>

          {inputFields.map(({ name, label, unit, inputMode, description }, index) => {
            if (name === "balloonPrincipal" && input.repaymentType !== "partialInstallment") return null;
            if (name === "creditInstallmentRatio" && input.loanType !== "credit") return null;
            if (name === "creditLoanTotalBalance" && input.loanType !== "credit") return null;
            if (name === "fixedRatePeriodMonths" && input.interestRateType !== "mixed") return null;
            if (name === "rateResetPeriodMonths" && input.interestRateType !== "periodic") return null;
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
                    ref={index === 0 ? annualIncomeRef : undefined}
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
            <legend>상환 방식</legend>
            <div className={styles.radioGrid}>
              {repaymentOptions.map((option) => (
                <label className={styles.radioCard} key={option.value}>
                  <input
                    type="radio"
                    name="repaymentType"
                    value={option.value}
                    checked={input.repaymentType === option.value}
                    onChange={handleRepaymentChange}
                  />
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </label>
              ))}
            </div>
          </fieldset>

          {input.loanType === "credit" && (
            <div className={styles.field}>
              <label htmlFor="creditRepaymentFrequency">신용대출 상환 주기</label>
              <div className={styles.selectShell}>
                <select
                  id="creditRepaymentFrequency"
                  name="creditRepaymentFrequency"
                  value={input.creditRepaymentFrequency}
                  onChange={handleSelectChange}
                >
                  <option value="monthly">매월</option>
                  <option value="quarterly">매분기</option>
                  <option value="other">그 외</option>
                </select>
              </div>
              <p className={styles.fieldDescription}>무거치·월/분기 균등분할·40% 이상·5~10년 조건을 모두 충족해야 실제 약정만기를 인정합니다.</p>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryButton} type="submit">
            DSR 계산
          </button>
          <button className={styles.secondaryButton} type="button" onClick={handleReset}>
            다시 계산
          </button>
        </div>
      </form>

      <section className={styles.resultCard} aria-labelledby="dsr-result-heading">
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>02 · 결과</p>
            <h2 id="dsr-result-heading">DSR 계산 결과</h2>
          </div>
          <p className={styles.muted}>심사 결과 아님</p>
        </div>

        {!result && (
          <div className={styles.emptyResult} aria-live="polite">
            <p>조건을 입력하면 일반 DSR, 공식 스트레스 DSR, 사용자 금리상승 시나리오를 구분해 계산합니다.</p>
          </div>
        )}

        {result && (
          <div aria-live="polite">
            {isResultStale && (
              <p className={styles.staleNotice}>입력값이 변경되었습니다. 다시 계산해 주세요.</p>
            )}
            <p className={styles.summaryValue}>{formatRate(result.base.dsrRate)}</p>
            <p className={styles.muted}>{result.base.interpretation}</p>

            <div className={styles.comparisonGrid}>
              <article>
                <h3>일반 DSR</h3>
                <p>{formatRate(result.base.dsrRate)}</p>
                <p>{formatWon(result.base.totalAnnualDebtPayment)} / 년</p>
              </article>
              <article>
                <h3>공식 스트레스 DSR</h3>
                <p>{formatRate(result.officialStressed.dsrRate)}</p>
                <p>{formatWon(result.officialStressed.totalAnnualDebtPayment)} / 년</p>
              </article>
              <article>
                <h3>사용자 금리상승 시나리오</h3>
                <p>{formatRate(result.stressed.dsrRate)}</p>
                <p>{formatWon(result.stressed.totalAnnualDebtPayment)} / 년</p>
              </article>
            </div>

            <dl className={styles.summaryGrid}>
              <div>
                <dt>정책 적용 여부</dt>
                <dd>{result.officialStressPolicy.applicable ? "적용" : "미적용"}</dd>
              </div>
              <div>
                <dt>정책 단계</dt>
                <dd>
                  {result.officialStressPolicy.policyStage
                    ? `${result.officialStressPolicy.policyStage}단계`
                    : "지원 기간 밖"}
                </dd>
              </div>
              <div>
                <dt>기본 스트레스 금리</dt>
                <dd>{formatPercentPoint(result.officialStressPolicy.baseStressRate)}</dd>
              </div>
              <div>
                <dt>단계 적용비율</dt>
                <dd>{formatMultiplier(result.officialStressPolicy.stageMultiplier)}</dd>
              </div>
              <div>
                <dt>금리유형 적용비율</dt>
                <dd>{formatMultiplier(result.officialStressPolicy.productMultiplier)}</dd>
              </div>
              <div>
                <dt>최종 적용 스트레스 금리</dt>
                <dd>{formatPercentPoint(result.officialStressPolicy.finalStressRate)}</dd>
              </div>
              <div>
                <dt>정책 기준일</dt>
                <dd>{result.officialStressPolicy.referenceDate}</dd>
              </div>
              <div>
                <dt>정책 유효기간</dt>
                <dd>{result.officialStressPolicy.effectiveFrom}~{result.officialStressPolicy.effectiveTo}</dd>
              </div>
            </dl>

            <p className={styles.notice}>{result.officialStressPolicy.reason}</p>

            <dl className={styles.summaryGrid}>
              <div>
                <dt>기존 대출 연간 DSR 원리금</dt>
                <dd>{formatWon(result.input.existingAnnualDebtPayment)}</dd>
              </div>
              <div>
                <dt>DSR 산정 연간 원금</dt>
                <dd>{formatWon(result.base.newLoanPayment.annualPrincipalForDsr)}</dd>
              </div>
              <div>
                <dt>DSR 산정 연간 이자</dt>
                <dd>{formatWon(result.base.newLoanPayment.annualInterestForDsr)}</dd>
              </div>
              <div>
                <dt>DSR 산정 연간 원리금</dt>
                <dd>{formatWon(result.base.newLoanPayment.annualPaymentForDsr)}</dd>
              </div>
              <div>
                <dt>계약상 향후 1년 납입액</dt>
                <dd>{formatWon(result.base.newLoanPayment.contractAnnualPayment)}</dd>
              </div>
              <div>
                <dt>DSR 기준 대비</dt>
                <dd>
                  {result.base.remainingDsrRateRoom >= 0 ? "여유 " : "초과 "}
                  {formatRate(Math.abs(result.base.remainingDsrRateRoom))}
                </dd>
              </div>
            </dl>

            <dl className={styles.detailGrid}>
              <div>
                <dt>원금균등 첫 달 월 상환액</dt>
                <dd>{formatWon(result.base.newLoanPayment.firstMonthlyPayment)}</dd>
              </div>
              <div>
                <dt>원금균등 평균 월 상환액</dt>
                <dd>{formatWon(result.base.newLoanPayment.averageMonthlyPayment)}</dd>
              </div>
              <div>
                <dt>DSR 산정만기</dt>
                <dd>{result.base.newLoanPayment.assessmentMaturityMonths}개월</dd>
              </div>
              <div>
                <dt>만기 원금 별도 확인</dt>
                <dd>{formatWon(result.base.newLoanPayment.maturityPrincipal)}</dd>
              </div>
            </dl>

            <p className={styles.notice}>{result.base.newLoanPayment.assessmentReason}</p>

            <p className={styles.notice}>
              공식 스트레스 금리는 DSR 심사용 가산금리이며 실제 대출 약정금리에
              추가로 부과되는 이자가 아닙니다. 사용자 금리상승 시나리오는 공식
              정책 결과와 별도인 참고값입니다. 실제 금융기관 심사는 제외대출,
              소득 인정 및 상품 세부조건에 따라 달라질 수 있습니다.
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

"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateCarCost,
  type CarCostInput,
  type CarCostInputField,
  type CarCostResult,
  type CarCostValidationError,
} from "@/lib/calculators/car-cost/car-cost";
import styles from "./CarCostCalculator.module.css";

type RawInputs = Record<CarCostInputField, string | boolean>;

const initialInputs: RawInputs = {
  monthlyDistanceKm: "1000",
  fuelEfficiencyKmPerL: "12",
  fuelPricePerL: "1700",
  annualInsuranceCost: "900000",
  annualCarTax: "300000",
  monthlyMaintenanceCost: "50000",
  monthlyParkingCost: "100000",
  monthlyTollCost: "30000",
  monthlyEtcCost: "20000",
  includeLoanPayment: false,
  monthlyLoanPayment: "0",
  includeDepreciation: false,
  monthlyDepreciationCost: "0",
};

const numberFields = [
  {
    name: "monthlyDistanceKm",
    label: "월 주행거리",
    unit: "km",
    description: "한 달 동안 주행하는 거리를 입력합니다.",
  },
  {
    name: "fuelEfficiencyKmPerL",
    label: "연비",
    unit: "km/L",
    description: "소수 입력이 가능합니다.",
  },
  {
    name: "fuelPricePerL",
    label: "유류 단가",
    unit: "원/L",
    description: "자동차 유류비 계산에 사용할 리터당 단가입니다.",
  },
  {
    name: "annualInsuranceCost",
    label: "연 보험료",
    unit: "원",
    description: "연간 보험료를 월 비용으로 환산합니다.",
  },
  {
    name: "annualCarTax",
    label: "연 자동차세",
    unit: "원",
    description: "연간 자동차세를 월 비용으로 환산합니다.",
  },
  {
    name: "monthlyMaintenanceCost",
    label: "월 정비·소모품 비용",
    unit: "원",
    description: "엔진오일, 타이어 등 월 평균 비용입니다.",
  },
  {
    name: "monthlyParkingCost",
    label: "월 주차비",
    unit: "원",
    description: "고정비에 포함됩니다.",
  },
  {
    name: "monthlyTollCost",
    label: "월 통행료",
    unit: "원",
    description: "변동비에 포함됩니다.",
  },
  {
    name: "monthlyEtcCost",
    label: "월 기타 비용",
    unit: "원",
    description: "세차, 부대비용 등을 입력합니다.",
  },
  {
    name: "monthlyLoanPayment",
    label: "월 할부금",
    unit: "원",
    description: "포함을 선택한 경우에만 총 부담에 더합니다.",
  },
  {
    name: "monthlyDepreciationCost",
    label: "월 감가상각비",
    unit: "원",
    description: "포함을 선택한 경우에만 총 부담에 더합니다.",
  },
] as const satisfies readonly {
  name: Exclude<
    CarCostInputField,
    "includeLoanPayment" | "includeDepreciation"
  >;
  label: string;
  unit: string;
  description: string;
}[];

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatLiter(value: number): string {
  return `${formatNumber(value)}L`;
}

function parseNumberInput(value: string | boolean): number | undefined {
  if (typeof value === "boolean") {
    return undefined;
  }

  const normalized = value.trim().replaceAll(",", "");
  return normalized === "" ? undefined : Number(normalized);
}

function parseInputs(input: RawInputs): Record<string, unknown> {
  return {
    monthlyDistanceKm: parseNumberInput(input.monthlyDistanceKm),
    fuelEfficiencyKmPerL: parseNumberInput(input.fuelEfficiencyKmPerL),
    fuelPricePerL: parseNumberInput(input.fuelPricePerL),
    annualInsuranceCost: parseNumberInput(input.annualInsuranceCost),
    annualCarTax: parseNumberInput(input.annualCarTax),
    monthlyMaintenanceCost: parseNumberInput(input.monthlyMaintenanceCost),
    monthlyParkingCost: parseNumberInput(input.monthlyParkingCost),
    monthlyTollCost: parseNumberInput(input.monthlyTollCost),
    monthlyEtcCost: parseNumberInput(input.monthlyEtcCost),
    includeLoanPayment: input.includeLoanPayment === true,
    monthlyLoanPayment: parseNumberInput(input.monthlyLoanPayment),
    includeDepreciation: input.includeDepreciation === true,
    monthlyDepreciationCost: parseNumberInput(input.monthlyDepreciationCost),
  };
}

function getErrorMessage(error: CarCostValidationError): string {
  return error.message;
}

function buildResultText(input: CarCostInput, result: CarCostResult): string {
  return [
    "자동차 유지비 계산 결과",
    `월 주행거리: ${formatNumber(input.monthlyDistanceKm)}km`,
    `연비: ${formatNumber(input.fuelEfficiencyKmPerL)}km/L`,
    `유류 단가: ${formatWon(input.fuelPricePerL)}/L`,
    `월 유류비: ${formatWon(result.monthlyFuelCost)}`,
    `월 고정비: ${formatWon(result.monthlyFixedCost)}`,
    `월 변동비: ${formatWon(result.monthlyVariableCost)}`,
    `월 운행 유지비: ${formatWon(result.monthlyOperatingCost)}`,
    `월 선택 비용: ${formatWon(result.monthlyOptionalCost)}`,
    `월 총 부담액: ${formatWon(result.monthlyTotalCost)}`,
    `연 총 부담액: ${formatWon(result.annualTotalCost)}`,
    `1km당 총 부담: ${formatWon(result.totalCostPerKm)}`,
    `할부금 포함: ${result.includedLoanPayment ? "예" : "아니오"}`,
    `감가상각 포함: ${result.includedDepreciation ? "예" : "아니오"}`,
  ].join("\n");
}

export function CarCostCalculator() {
  const [input, setInput] = useState(initialInputs);
  const [errors, setErrors] = useState<CarCostValidationError[]>([]);
  const [result, setResult] = useState<CarCostResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<CarCostInput | null>(
    null,
  );
  const [isResultStale, setIsResultStale] = useState(false);
  const [isShareSupported] = useState(
    () =>
      typeof navigator !== "undefined" && typeof navigator.share === "function",
  );
  const [actionMessage, setActionMessage] = useState("");
  const inputRefs = useRef<Partial<Record<CarCostInputField, HTMLInputElement>>>(
    {},
  );

  const errorsByField = errors.reduce<
    Partial<Record<CarCostInputField, CarCostValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as CarCostInputField;
    const value =
      event.currentTarget.type === "checkbox"
        ? event.currentTarget.checked
        : event.currentTarget.value;

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
    const response = calculateCarCost(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);
      const firstErrorField = numberFields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      inputRefs.current[firstErrorField?.name ?? "monthlyDistanceKm"]?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(parsedInput as unknown as CarCostInput);
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    setActionMessage("");
    inputRefs.current.monthlyDistanceKm?.focus();
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
        title: "자동차 유지비 계산 결과",
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

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 차량 유지 조건</p>
            <h2>자동차 유지비를 입력하세요</h2>
          </div>
          <p>월 비용과 연간 환산 비용을 함께 계산합니다.</p>
        </div>

        <div className={styles.fieldGrid}>
          {numberFields.map(({ name, label, unit, description }) => {
            const fieldErrors = errorsByField[name] ?? [];
            const descriptionId = `${name}-description`;
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
                    inputMode="decimal"
                    autoComplete="off"
                    value={input[name] as string}
                    onChange={handleChange}
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

          <div className={styles.checkboxField}>
            <input
              id="includeLoanPayment"
              name="includeLoanPayment"
              type="checkbox"
              checked={input.includeLoanPayment as boolean}
              onChange={handleChange}
            />
            <label htmlFor="includeLoanPayment">월 할부금 포함</label>
          </div>

          <div className={styles.checkboxField}>
            <input
              id="includeDepreciation"
              name="includeDepreciation"
              type="checkbox"
              checked={input.includeDepreciation as boolean}
              onChange={handleChange}
            />
            <label htmlFor="includeDepreciation">월 감가상각비 포함</label>
          </div>
        </div>

        <p className={styles.storageNotice}>
          입력값은 서버로 전송하지 않고 현재 화면에서만 계산합니다.
        </p>

        {errors.length > 0 && (
          <p className={styles.errorSummary} role="alert">
            입력값을 확인해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.calculateButton} type="submit">
            {result ? "다시 계산하기" : "자동차 유지비 계산하기"}
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
          <h2>자동차 한달 유지비를 확인하세요</h2>
          <p>주행거리와 비용을 입력하면 월·연 비용과 1km당 비용을 계산합니다.</p>
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
            aria-labelledby="car-cost-result-heading"
          >
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>02 · 계산 결과</p>
                <h2 id="car-cost-result-heading">자동차 유지비 요약</h2>
              </div>
              <p>금액은 원 단위 반올림</p>
            </div>

            <dl className={styles.summaryGrid}>
              <div>
                <dt>월 고정비</dt>
                <dd>{formatWon(result.monthlyFixedCost)}</dd>
              </div>
              <div>
                <dt>월 변동비</dt>
                <dd>{formatWon(result.monthlyVariableCost)}</dd>
              </div>
              <div>
                <dt>월 총 자동차 유지비</dt>
                <dd>{formatWon(result.monthlyOperatingCost)}</dd>
              </div>
              <div>
                <dt>월 총 부담액</dt>
                <dd>{formatWon(result.monthlyTotalCost)}</dd>
              </div>
              <div>
                <dt>연간 환산 비용</dt>
                <dd>{formatWon(result.annualTotalCost)}</dd>
              </div>
              <div>
                <dt>1km당 비용</dt>
                <dd>{formatWon(result.totalCostPerKm)}</dd>
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
                <h2 id="detail-title">항목별 비용</h2>
              </div>
              <p>고정비, 변동비, 선택 비용을 분리합니다.</p>
            </div>

            <dl className={styles.detailGrid}>
              <div>
                <dt>월 유류 사용량</dt>
                <dd>{formatLiter(result.monthlyFuelUsageL)}</dd>
              </div>
              <div>
                <dt>월 유류비</dt>
                <dd>{formatWon(result.monthlyFuelCost)}</dd>
              </div>
              <div>
                <dt>연 유류비</dt>
                <dd>{formatWon(result.annualFuelCost)}</dd>
              </div>
              <div>
                <dt>월 보험료 환산</dt>
                <dd>{formatWon(result.monthlyInsuranceCost)}</dd>
              </div>
              <div>
                <dt>월 자동차세 환산</dt>
                <dd>{formatWon(result.monthlyCarTax)}</dd>
              </div>
              <div>
                <dt>월 주차비</dt>
                <dd>{formatWon(calculatedInput.monthlyParkingCost)}</dd>
              </div>
              <div>
                <dt>월 정비·소모품 비용</dt>
                <dd>{formatWon(calculatedInput.monthlyMaintenanceCost)}</dd>
              </div>
              <div>
                <dt>월 통행료</dt>
                <dd>{formatWon(calculatedInput.monthlyTollCost)}</dd>
              </div>
              <div>
                <dt>월 기타 비용</dt>
                <dd>{formatWon(calculatedInput.monthlyEtcCost)}</dd>
              </div>
              <div>
                <dt>월 고정비</dt>
                <dd>{formatWon(result.monthlyFixedCost)}</dd>
              </div>
              <div>
                <dt>월 변동비</dt>
                <dd>{formatWon(result.monthlyVariableCost)}</dd>
              </div>
              <div>
                <dt>월 운행 유지비</dt>
                <dd>{formatWon(result.monthlyOperatingCost)}</dd>
              </div>
              <div>
                <dt>연 운행 유지비</dt>
                <dd>{formatWon(result.annualOperatingCost)}</dd>
              </div>
              <div>
                <dt>월 선택 비용</dt>
                <dd>{formatWon(result.monthlyOptionalCost)}</dd>
              </div>
              <div>
                <dt>월 총 부담</dt>
                <dd>{formatWon(result.monthlyTotalCost)}</dd>
              </div>
              <div>
                <dt>연 총 부담</dt>
                <dd>{formatWon(result.annualTotalCost)}</dd>
              </div>
              <div>
                <dt>1km당 유류비</dt>
                <dd>{formatWon(result.fuelCostPerKm)}</dd>
              </div>
              <div>
                <dt>1km당 운행 유지비</dt>
                <dd>{formatWon(result.operatingCostPerKm)}</dd>
              </div>
              <div>
                <dt>1km당 총 부담</dt>
                <dd>{formatWon(result.totalCostPerKm)}</dd>
              </div>
            </dl>
          </section>

          <aside className={styles.notice}>
            <p>
              선택 비용 포함 여부: 할부금{" "}
              {result.includedLoanPayment ? "포함" : "미포함"}, 감가상각{" "}
              {result.includedDepreciation ? "포함" : "미포함"}
            </p>
            <p>
              월 총 부담액은 운행 유지비에 선택 비용을 더한 값입니다. 실제
              지출은 차량 상태, 보험 조건, 유가와 주차 환경에 따라 달라질 수
              있습니다.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

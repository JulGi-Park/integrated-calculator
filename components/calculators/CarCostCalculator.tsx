"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import {
  calculateCarCost,
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
    description: "휘발유·경유 등 실제 단가를 직접 입력합니다.",
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

function formatLiter(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  })}L`;
}

function parseInputs(input: RawInputs): Record<string, unknown> {
  return {
    monthlyDistanceKm: Number(input.monthlyDistanceKm),
    fuelEfficiencyKmPerL: Number(input.fuelEfficiencyKmPerL),
    fuelPricePerL: Number(input.fuelPricePerL),
    annualInsuranceCost: Number(input.annualInsuranceCost),
    annualCarTax: Number(input.annualCarTax),
    monthlyMaintenanceCost: Number(input.monthlyMaintenanceCost),
    monthlyParkingCost: Number(input.monthlyParkingCost),
    monthlyTollCost: Number(input.monthlyTollCost),
    monthlyEtcCost: Number(input.monthlyEtcCost),
    includeLoanPayment: input.includeLoanPayment === true,
    monthlyLoanPayment: Number(input.monthlyLoanPayment),
    includeDepreciation: input.includeDepreciation === true,
    monthlyDepreciationCost: Number(input.monthlyDepreciationCost),
  };
}

function getErrorMessage(error: CarCostValidationError): string {
  return error.message;
}

export function CarCostCalculator() {
  const [input, setInput] = useState(initialInputs);
  const [errors, setErrors] = useState<CarCostValidationError[]>([]);
  const [result, setResult] = useState<CarCostResult | null>(null);
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
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = calculateCarCost(parseInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      const firstErrorField = numberFields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      inputRefs.current[firstErrorField?.name ?? "monthlyDistanceKm"]?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    inputRefs.current.monthlyDistanceKm?.focus();
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 차량 유지 조건</p>
            <h2>자동차 유지비를 입력하세요</h2>
          </div>
          <p>1차 로컬 비공개 계산 UI</p>
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
                  <p className={styles.fieldError} id={errorId}>
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
            자동차 유지비 계산하기
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
          <h2>월간·연간 유지비를 확인하세요</h2>
          <p>주행거리와 비용을 입력하면 유지비와 1km당 비용을 계산합니다.</p>
        </section>
      )}

      {result && (
        <div className={styles.results}>
          <section
            className={styles.summaryCard}
            aria-labelledby="car-cost-result-heading"
          >
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>02 · 계산 결과</p>
                <h2 id="car-cost-result-heading">자동차 유지비 요약</h2>
              </div>
              <p>원 단위 반올림</p>
            </div>

            <dl className={styles.summaryGrid}>
              <div>
                <dt>월 운행 유지비</dt>
                <dd>{formatWon(result.monthlyOperatingCost)}</dd>
              </div>
              <div>
                <dt>월 총 부담</dt>
                <dd>{formatWon(result.monthlyTotalCost)}</dd>
              </div>
              <div>
                <dt>1km당 총 부담</dt>
                <dd>{formatWon(result.totalCostPerKm)}</dd>
              </div>
            </dl>

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
                <dt>월 고정비</dt>
                <dd>{formatWon(result.monthlyFixedCost)}</dd>
              </div>
              <div>
                <dt>월 변동비</dt>
                <dd>{formatWon(result.monthlyVariableCost)}</dd>
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
                <dt>연 총 부담</dt>
                <dd>{formatWon(result.annualTotalCost)}</dd>
              </div>
              <div>
                <dt>1km당 운행 유지비</dt>
                <dd>{formatWon(result.operatingCostPerKm)}</dd>
              </div>
            </dl>
          </section>

          <aside className={styles.notice}>
            <p>
              할부금 포함: {result.includedLoanPayment ? "예" : "아니오"} ·
              감가상각 포함: {result.includedDepreciation ? "예" : "아니오"}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

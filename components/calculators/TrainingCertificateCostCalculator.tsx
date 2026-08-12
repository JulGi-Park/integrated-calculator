"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateTrainingCertificateCostFromUnknown,
  normalizeTrainingCertificateCostInput,
  TRAINING_CERTIFICATE_COST_LIMITS,
  type TrainingCertificateCostInput,
  type TrainingCertificateCostInputField,
  type TrainingCertificateCostResult,
  type TrainingCertificateCostValidationError,
} from "@/lib/calculators/training-certificate-cost";
import styles from "./TrainingCertificateCostCalculator.module.css";

type RawInputs = Record<TrainingCertificateCostInputField, string>;

interface FieldDefinition {
  name: TrainingCertificateCostInputField;
  label: string;
  unit: "원" | "회";
  description?: string;
  optional?: boolean;
}

const trainingCostFields: FieldDefinition[] = [
  {
    name: "totalTrainingCost",
    label: "총 훈련비",
    unit: "원",
    description: "고용24 과정 상세페이지의 총 훈련비를 입력합니다.",
  },
  {
    name: "trainingSelfPayAmount",
    label: "본인부담 훈련비",
    unit: "원",
    description: "자비부담액보기에서 확인한 본인부담액을 입력합니다.",
  },
];

const examFields: FieldDefinition[] = [
  {
    name: "examFee",
    label: "1회 응시료",
    unit: "원",
    description: "필기·실기 등을 합친 1회 응시 기준 비용입니다.",
  },
  {
    name: "expectedExamAttempts",
    label: "예상 응시 횟수",
    unit: "회",
    description: "최소 1회 이상의 정수로 입력합니다.",
  },
];

const additionalCostFields: FieldDefinition[] = [
  { name: "textbookCost", label: "교재비", unit: "원", optional: true },
  {
    name: "practiceMaterialCost",
    label: "실습·재료비",
    unit: "원",
    optional: true,
  },
  {
    name: "transportationCost",
    label: "훈련기간 총 교통비",
    unit: "원",
    optional: true,
  },
  {
    name: "mealCost",
    label: "훈련기간 총 식비",
    unit: "원",
    optional: true,
  },
  { name: "otherCost", label: "기타 비용", unit: "원", optional: true },
];

const allFields = [
  ...trainingCostFields,
  ...examFields,
  ...additionalCostFields,
];

const initialInputs: RawInputs = {
  totalTrainingCost: "",
  trainingSelfPayAmount: "",
  examFee: "",
  expectedExamAttempts: "1",
  textbookCost: "",
  practiceMaterialCost: "",
  transportationCost: "",
  mealCost: "",
  otherCost: "",
};

const amountFields = new Set<TrainingCertificateCostInputField>(
  allFields
    .filter(({ unit }) => unit === "원")
    .map(({ name }) => name),
);

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

function formatWon(value: number): string {
  return `${wonFormatter.format(value)}원`;
}

function formatAmountInput(value: string): string {
  const normalized = value.replaceAll(",", "");

  if (!/^-?\d+$/.test(normalized)) {
    return value;
  }

  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function parseInput(input: RawInputs): Record<string, unknown> {
  return Object.fromEntries(
    allFields.map(({ name, optional }) => {
      const rawValue = input[name].trim();

      if (rawValue === "") {
        return [name, optional ? "" : undefined];
      }

      return [name, Number(rawValue.replaceAll(",", ""))];
    }),
  );
}

function getFieldErrorMessage(
  error: TrainingCertificateCostValidationError,
): string {
  return error.message;
}

function CostField({
  field,
  value,
  errors,
  inputRef,
  onChange,
}: {
  field: FieldDefinition;
  value: string;
  errors: TrainingCertificateCostValidationError[];
  inputRef: (element: HTMLInputElement | null) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const descriptionId = `${field.name}-description`;
  const errorId = `${field.name}-error`;
  const describedBy = [
    field.description ? descriptionId : null,
    errors.length > 0 ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={field.name}>
        {field.label}
        {field.optional && <span className={styles.optional}>선택</span>}
      </label>
      <div
        className={`${styles.inputShell} ${
          errors.length > 0 ? styles.inputShellError : ""
        }`}
      >
        <input
          ref={inputRef}
          id={field.name}
          name={field.name}
          aria-label={field.label}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={onChange}
          aria-invalid={errors.length > 0}
          aria-describedby={describedBy || undefined}
        />
        <span aria-hidden="true">{field.unit}</span>
      </div>
      {field.description && (
        <p className={styles.fieldDescription} id={descriptionId}>
          {field.description}
        </p>
      )}
      {errors.length > 0 && (
        <p className={styles.fieldError} id={errorId}>
          {errors.map(getFieldErrorMessage).join(" ")}
        </p>
      )}
    </div>
  );
}

export function TrainingCertificateCostCalculator() {
  const [input, setInput] = useState<RawInputs>(initialInputs);
  const [errors, setErrors] = useState<
    TrainingCertificateCostValidationError[]
  >([]);
  const [result, setResult] = useState<TrainingCertificateCostResult | null>(
    null,
  );
  const [calculatedInput, setCalculatedInput] =
    useState<TrainingCertificateCostInput | null>(null);
  const [isResultStale, setIsResultStale] = useState(false);
  const inputRefs = useRef<
    Partial<Record<TrainingCertificateCostInputField, HTMLInputElement>>
  >({});

  const errorsByField = errors.reduce<
    Partial<
      Record<
        TrainingCertificateCostInputField,
        TrainingCertificateCostValidationError[]
      >
    >
  >((grouped, error) => {
    if (error.field !== "calculation") {
      grouped[error.field] = [...(grouped[error.field] ?? []), error];
    }

    return grouped;
  }, {});
  const calculationErrors = errors.filter(
    (error) => error.field === "calculation",
  );

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as TrainingCertificateCostInputField;
    const rawValue = event.currentTarget.value;
    const value = amountFields.has(field)
      ? formatAmountInput(rawValue)
      : rawValue;

    setInput((current) => ({ ...current, [field]: value }));
    setErrors([]);

    if (result) {
      setIsResultStale(true);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedInput = parseInput(input);
    const normalizedInput = normalizeTrainingCertificateCostInput(parsedInput);
    const response = calculateTrainingCertificateCostFromUnknown(parsedInput);

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setCalculatedInput(null);
      setIsResultStale(false);

      const firstErrorField = allFields.find(({ name }) =>
        response.errors.some((error) => error.field === name),
      );
      inputRefs.current[firstErrorField?.name ?? "totalTrainingCost"]?.focus();
      return;
    }

    setErrors([]);
    setResult(response.data);
    setCalculatedInput(normalizedInput as TrainingCertificateCostInput);
    setIsResultStale(false);
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    setCalculatedInput(null);
    setIsResultStale(false);
    inputRefs.current.totalTrainingCost?.focus();
  }

  function renderFields(fields: FieldDefinition[]) {
    return fields.map((field) => (
      <CostField
        key={field.name}
        field={field}
        value={input[field.name]}
        errors={errorsByField[field.name] ?? []}
        inputRef={(element) => {
          if (element) {
            inputRefs.current[field.name] = element;
          }
        }}
        onChange={handleChange}
      />
    ));
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.step}>01 · 비용 입력</p>
            <h2>자격증 취득에 필요한 비용을 입력하세요</h2>
          </div>
          <p>
            각 금액은 최대 {formatWon(TRAINING_CERTIFICATE_COST_LIMITS.maximumAmount)}
          </p>
        </div>

        <section className={styles.inputSection} aria-labelledby="training-cost-heading">
          <div className={styles.sectionHeading}>
            <h3 id="training-cost-heading">국비지원 훈련비</h3>
            <p>
              고용24 과정 상세페이지에 표시된 훈련비와 본인부담액을 입력하면
              보다 정확한 예상값을 확인할 수 있습니다.
            </p>
          </div>
          <div className={styles.fieldGrid}>{renderFields(trainingCostFields)}</div>
        </section>

        <section className={styles.inputSection} aria-labelledby="exam-cost-heading">
          <div className={styles.sectionHeading}>
            <h3 id="exam-cost-heading">자격증 시험</h3>
            <p>재응시를 예상한다면 총 응시 횟수를 입력하세요.</p>
          </div>
          <div className={styles.fieldGrid}>{renderFields(examFields)}</div>
        </section>

        <section className={styles.inputSection} aria-labelledby="additional-cost-heading">
          <div className={styles.sectionHeading}>
            <h3 id="additional-cost-heading">추가 비용</h3>
            <p>입력하지 않은 선택 비용은 0원으로 계산합니다.</p>
          </div>
          <div className={styles.fieldGrid}>{renderFields(additionalCostFields)}</div>
        </section>

        {errors.length > 0 && (
          <div className={styles.errorSummary} role="alert">
            <strong>입력값을 확인해 주세요.</strong>
            {calculationErrors.map((error) => (
              <span key={`${error.field}-${error.code}`}>{error.message}</span>
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

      {!result && (
        <section className={styles.emptyCard} aria-live="polite">
          <span aria-hidden="true">₩</span>
          <h2>예상 취득비용을 계산해 보세요</h2>
          <p>훈련비와 시험·추가 비용을 입력하면 본인부담 예상액을 보여드립니다.</p>
        </section>
      )}

      {result && calculatedInput && (
        <div className={styles.results}>
          {isResultStale && (
            <p className={styles.staleNotice} role="status">
              입력값이 변경되었습니다. 다시 계산해 최신 결과를 확인해 주세요.
            </p>
          )}

          <section
            className={styles.primaryResultCard}
            aria-labelledby="training-certificate-result-heading"
          >
            <p className={styles.step}>02 · 예상 결과</p>
            <h2 id="training-certificate-result-heading">
              국비지원 적용 후 자격증 취득 예상비용
            </h2>
            <strong className={styles.primaryAmount}>
              {formatWon(result.estimatedTotalOutOfPocket)}
            </strong>
            <p>총 본인부담 예상액</p>
          </section>

          <section className={styles.resultCard} aria-labelledby="support-summary-heading">
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>03 · 지원 효과</p>
                <h2 id="support-summary-heading">국비지원 비용 요약</h2>
              </div>
            </div>
            <dl className={styles.summaryGrid}>
              <div>
                <dt>국비지원 예상액</dt>
                <dd>{formatWon(result.estimatedGovernmentSupportAmount)}</dd>
              </div>
              <div>
                <dt>국비지원 전 예상 취득비용</dt>
                <dd>{formatWon(result.estimatedTotalCostWithoutSupport)}</dd>
              </div>
              <div>
                <dt>예상 절감액</dt>
                <dd>{formatWon(result.estimatedSavingsAmount)}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.resultCard} aria-labelledby="cost-breakdown-heading">
            <div className={styles.cardHeading}>
              <div>
                <p className={styles.step}>04 · 비용 상세</p>
                <h2 id="cost-breakdown-heading">본인부담 비용 내역</h2>
              </div>
              <p>0원 항목도 전체 비용 확인을 위해 표시합니다.</p>
            </div>
            <dl className={styles.breakdownList}>
              <div>
                <dt>훈련비 본인부담</dt>
                <dd>{formatWon(calculatedInput.trainingSelfPayAmount)}</dd>
              </div>
              <div>
                <dt>시험 응시비</dt>
                <dd>{formatWon(result.totalExamCost)}</dd>
              </div>
              <div>
                <dt>교재비</dt>
                <dd>{formatWon(calculatedInput.textbookCost)}</dd>
              </div>
              <div>
                <dt>실습·재료비</dt>
                <dd>{formatWon(calculatedInput.practiceMaterialCost)}</dd>
              </div>
              <div>
                <dt>교통비</dt>
                <dd>{formatWon(calculatedInput.transportationCost)}</dd>
              </div>
              <div>
                <dt>식비</dt>
                <dd>{formatWon(calculatedInput.mealCost)}</dd>
              </div>
              <div>
                <dt>기타 비용</dt>
                <dd>{formatWon(calculatedInput.otherCost)}</dd>
              </div>
              <div className={styles.breakdownTotal}>
                <dt>총 본인부담 예상액</dt>
                <dd>{formatWon(result.estimatedTotalOutOfPocket)}</dd>
              </div>
            </dl>
          </section>

          <aside className={styles.notice} aria-label="계산 결과 안내">
            <p>본 계산 결과는 입력한 금액을 기준으로 한 예상값입니다.</p>
            <p>
              실제 국비지원 금액과 본인부담액은 훈련과정과 적용 조건에 따라
              달라질 수 있습니다.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

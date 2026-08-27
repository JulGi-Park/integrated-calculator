"use client";

import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import {
  calculateHousingAcquisitionTax,
  type HousingAcquisitionTaxInput,
  type HousingAcquisitionTaxResult,
  type HousingAcquisitionTaxValidationError,
} from "@/lib/calculators/housing-acquisition-tax";
import styles from "./LaborPayCalculator.module.css";

type RawInput = {
  acquisitionPrice: string;
  existingHomeCount: HousingAcquisitionTaxInput["existingHomeCount"];
  regulatoryArea: HousingAcquisitionTaxInput["regulatoryArea"];
  exceeds85SquareMeters: boolean;
};

const initialInput: RawInput = {
  acquisitionPrice: "",
  existingHomeCount: "0",
  regulatoryArea: "non-regulated",
  exceeds85SquareMeters: false,
};

const wonFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const formatWon = (value: number) => `${wonFormatter.format(value)}원`;

function parseInput(input: RawInput): HousingAcquisitionTaxInput {
  return {
    ...input,
    acquisitionPrice: input.acquisitionPrice === ""
      ? undefined as unknown as number
      : Number(input.acquisitionPrice.replaceAll(",", "")),
  };
}

function getErrorMessage(error: HousingAcquisitionTaxValidationError): string {
  if (error.field === "acquisitionPrice") {
    if (error.code === "REQUIRED") return "취득가액을 입력해 주세요.";
    if (error.code === "MUST_BE_POSITIVE") return "취득가액은 0원보다 커야 합니다.";
    if (error.code === "MUST_BE_INTEGER") return "취득가액은 원 단위 정수로 입력해 주세요.";
    if (error.code === "OUT_OF_RANGE") return "취득가액은 1조원 이하로 입력해 주세요.";
    return "취득가액을 숫자로 입력해 주세요.";
  }
  return "선택값을 확인해 주세요.";
}

export function HousingAcquisitionTaxCalculator() {
  const [input, setInput] = useState<RawInput>(initialInput);
  const [result, setResult] = useState<HousingAcquisitionTaxResult | null>(null);
  const [errors, setErrors] = useState<HousingAcquisitionTaxValidationError[]>([]);
  const [stale, setStale] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);
  const priceErrors = errors.filter((error) => error.field === "acquisitionPrice");

  function markChanged() {
    setErrors([]);
    if (result) setStale(true);
  }

  function handlePriceChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.currentTarget.value.replaceAll(",", "");
    const formatted = /^\d*$/.test(digits)
      ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : event.currentTarget.value;
    setInput((current) => ({ ...current, acquisitionPrice: formatted }));
    markChanged();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = calculateHousingAcquisitionTax(parseInput(input));
    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setStale(false);
      priceRef.current?.focus();
      return;
    }
    setErrors([]);
    setResult(response.data);
    setStale(false);
  }

  return (
    <div className={styles.calculator}>
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <div className={styles.cardHeading}>
          <div><p className={styles.step}>Step 1</p><h2>취득 조건 입력</h2></div>
          <p>개인·국내 주택의 일반 유상취득만 계산합니다.</p>
        </div>
        <div className={styles.fieldGrid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="acquisitionPrice">취득가액</label>
            <div className={`${styles.inputShell} ${priceErrors.length ? styles.inputShellError : ""}`}>
              <input ref={priceRef} id="acquisitionPrice" name="acquisitionPrice" inputMode="numeric" value={input.acquisitionPrice} onChange={handlePriceChange} aria-invalid={priceErrors.length > 0} />
              <span>원</span>
            </div>
            <p className={styles.helper}>매매계약의 과세표준으로 사용할 취득가액을 원 단위로 입력하세요.</p>
            {priceErrors.map((error) => <p className={styles.fieldError} role="alert" key={error.code}>{getErrorMessage(error)}</p>)}
          </div>
          <fieldset className={`${styles.field} ${styles.fieldFull}`}>
            <legend className={styles.fieldLegend}>취득 전 보유 주택 수</legend>
            <div className={styles.segmented}>
              {([ ["0", "0주택"], ["1", "1주택"], ["2", "2주택"], ["3-plus", "3주택 이상"] ] as const).map(([value, label]) => <button className={`${styles.segmentButton} ${input.existingHomeCount === value ? styles.segmentButtonActive : ""}`} type="button" onClick={() => { setInput((current) => ({ ...current, existingHomeCount: value })); markChanged(); }} aria-pressed={input.existingHomeCount === value} key={value}>{label}</button>)}
            </div>
            <p className={styles.helper}>세대 기준 주택 수의 예외 판단은 포함하지 않습니다.</p>
          </fieldset>
          <fieldset className={`${styles.field} ${styles.fieldFull}`}>
            <legend className={styles.fieldLegend}>취득 주택의 조정대상지역 여부</legend>
            <div className={styles.segmented}>
              {([ ["non-regulated", "비조정대상지역"], ["regulated", "조정대상지역"] ] as const).map(([value, label]) => <button className={`${styles.segmentButton} ${input.regulatoryArea === value ? styles.segmentButtonActive : ""}`} type="button" onClick={() => { setInput((current) => ({ ...current, regulatoryArea: value })); markChanged(); }} aria-pressed={input.regulatoryArea === value} key={value}>{label}</button>)}
            </div>
            <p className={styles.helper}>지역 지정 여부는 취득일 기준으로 직접 확인해 선택하세요.</p>
          </fieldset>
          <label className={`${styles.checkboxRow} ${styles.fieldFull}`} htmlFor="exceeds85SquareMeters"><input id="exceeds85SquareMeters" type="checkbox" checked={input.exceeds85SquareMeters} onChange={(event) => { const checked = event.currentTarget.checked; setInput((current) => ({ ...current, exceeds85SquareMeters: checked })); markChanged(); }} />전용면적이 85㎡를 초과합니다</label>
        </div>
        {errors.filter((error) => error.field !== "acquisitionPrice").map((error) => <p className={styles.fieldError} role="alert" key={`${error.field}-${error.code}`}>{getErrorMessage(error)}</p>)}
        <div className={styles.actions}><button className={styles.calculateButton} type="submit">취득세 계산하기</button><button className={styles.resetButton} type="button" onClick={() => { setInput(initialInput); setResult(null); setErrors([]); setStale(false); priceRef.current?.focus(); }}>초기화</button></div>
      </form>

      <section className={styles.resultCard} aria-label="주택 취득세 계산 결과" aria-live="polite">
        <div className={styles.cardHeading}><div><p className={styles.step}>Step 2</p><h2>예상 세액</h2></div><p>정책 확인일 2026-08-27</p></div>
        <div className={styles.resultLive}>
          {!result ? <div className={styles.emptyResult}><span aria-hidden="true">₩</span><p>취득가액과 보유 조건을 입력하면 세목별 예상액을 표시합니다.</p></div> : <div>
            {stale ? <p className={styles.staleNotice}>입력값이 변경되었습니다. 다시 계산하면 최신 결과로 갱신됩니다.</p> : null}
            <div className={styles.primaryResult}><span className={`${styles.status} ${styles.eligible}`}>{result.acquisitionTaxRateLabel}</span><p>예상 총 납부세액</p><strong>{formatWon(result.finalTotal)}</strong></div>
            <dl className={styles.resultList}>
              <div><dt>과세표준</dt><dd>{formatWon(result.taxableBase)}</dd></div>
              <div><dt>적용 취득세율</dt><dd>{result.acquisitionTaxRateLabel}</dd></div>
              <div><dt>취득세</dt><dd>{formatWon(result.acquisitionTax)}</dd></div>
              <div><dt>지방교육세</dt><dd>{formatWon(result.localEducationTax)}</dd></div>
              <div><dt>농어촌특별세</dt><dd>{formatWon(result.ruralSpecialTax)}</dd></div>
              <div><dt>감면액</dt><dd>{formatWon(result.reliefAmount)} (자동 반영 안 함)</dd></div>
            </dl>
            <dl className={styles.detailList}><div><dt>적용 기준</dt><dd>{result.appliedRule}</dd></div>{result.formulas.map((formula) => <div key={formula}><dt>계산식</dt><dd>{formula}</dd></div>)}</dl>
            {result.warnings.map((warning) => <p className={styles.warning} key={warning}>{warning}</p>)}
          </div>}
        </div>
      </section>
    </div>
  );
}

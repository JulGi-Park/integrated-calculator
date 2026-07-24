"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  PARENTAL_LEAVE_POLICY_2026,
  type ParentalLeaveInputField,
  type ParentalLeaveValidationError,
} from "@/lib/calculators/parental-leave/parentalLeave";
import { buildParentalLeaveResultPresentation } from "@/lib/calculators/parental-leave/parentalLeaveResultPresentation";
import { calculateParentalLeaveWithSpecialPolicy } from "@/lib/calculators/parental-leave/parentalLeaveSpecialRules";
import type {
  ParentalLeaveResultPresentation,
} from "@/lib/calculators/parental-leave/parentalLeaveResultPresentation";
import {
  formatWon,
} from "./parentalLeaveClientUtils";
import styles from "./ParentalLeaveCalculator.module.css";

type SpecialPolicyMode = "general" | "sixPlusSix" | "singleParent";
type TernaryInput = "" | "yes" | "no" | "unknown";

type RawInputs = {
  monthlyOrdinaryWage: string;
  leaveMonths: string;
  specialPolicyMode: SpecialPolicyMode;
  childAgeMonths: string;
  partnerUsedParentalLeave: TernaryInput;
  partnerLeaveMonths: string;
  sameChild: TernaryInput;
  isSingleParent: TernaryInput;
};

const initialInputs: RawInputs = {
  monthlyOrdinaryWage: "",
  leaveMonths: "",
  specialPolicyMode: "general",
  childAgeMonths: "",
  partnerUsedParentalLeave: "",
  partnerLeaveMonths: "",
  sameChild: "",
  isSingleParent: "",
};

const fieldLabels: Record<ParentalLeaveInputField, string> = {
  monthlyOrdinaryWage: "월 통상임금",
  leaveMonths: "육아휴직 사용 개월 수",
};

function formatAmountInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");

  if (digitsOnly === "") {
    return "";
  }

  return Number(digitsOnly).toLocaleString("ko-KR");
}

function parseNumberInput(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value.replaceAll(",", ""));
}

function parseTernaryInput(value: TernaryInput): boolean | "unknown" | undefined {
  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  if (value === "unknown") {
    return "unknown";
  }

  return undefined;
}

function parseInputs(input: RawInputs) {
  const baseInput = {
    monthlyOrdinaryWage:
      input.monthlyOrdinaryWage.trim() === ""
        ? undefined
        : Number(input.monthlyOrdinaryWage.replaceAll(",", "")),
    leaveMonths:
      input.leaveMonths.trim() === "" ? undefined : Number(input.leaveMonths),
  };

  if (input.specialPolicyMode === "sixPlusSix") {
    return {
      ...baseInput,
      specialPolicy: "parentsTogetherSixPlusSix" as const,
      childAgeMonths: parseNumberInput(input.childAgeMonths),
      partnerUsedParentalLeave: parseTernaryInput(input.partnerUsedParentalLeave),
      partnerLeaveMonths: parseNumberInput(input.partnerLeaveMonths),
      sameChild: parseTernaryInput(input.sameChild),
    };
  }

  if (input.specialPolicyMode === "singleParent") {
    return {
      ...baseInput,
      specialPolicy: "singleParent" as const,
      isSingleParent: parseTernaryInput(input.isSingleParent),
    };
  }

  return baseInput;
}

function getErrorMessage(error: ParentalLeaveValidationError): string {
  return error.message || `${fieldLabels[error.field]} 입력값을 확인해 주세요.`;
}

function buildResultText(result: ParentalLeaveResultPresentation): string {
  return [
    result.title,
    result.primaryNotice,
    `적용된 계산 방식: ${result.appliedPolicyLabel}`,
    result.notAppliedPolicyLabels.length > 0
      ? `적용되지 않은 계산 방식: ${result.notAppliedPolicyLabels.join(", ")}`
      : "",
    `총 예상 급여: ${formatWon(result.totalEstimatedAmount)}`,
    `계산 기준일: ${result.policyDate}`,
    result.monthlyRows
      .map((row) => `${row.month}개월차: ${formatWon(row.amount)} (${row.policyLabel})`)
      .join("\n"),
    result.disclaimer,
  ]
    .filter(Boolean)
    .join("\n");
}

export function ParentalLeaveCalculator() {
  const [input, setInput] = useState<RawInputs>(initialInputs);
  const [errors, setErrors] = useState<ParentalLeaveValidationError[]>([]);
  const [result, setResult] = useState<ParentalLeaveResultPresentation | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const wageInputRef = useRef<HTMLInputElement>(null);
  const monthsInputRef = useRef<HTMLInputElement>(null);

  const errorsByField = errors.reduce<
    Partial<Record<ParentalLeaveInputField, ParentalLeaveValidationError[]>>
  >((grouped, error) => {
    grouped[error.field] = [...(grouped[error.field] ?? []), error];
    return grouped;
  }, {});

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as keyof RawInputs;
    const rawValue = event.currentTarget.value;
    const nextValue =
      field === "monthlyOrdinaryWage" ? formatAmountInput(rawValue) : rawValue;

    setInput({ ...input, [field]: nextValue });
    setErrors([]);
    setFeedback("");
  }

  function handleSpecialPolicyChange(event: ChangeEvent<HTMLInputElement>) {
    const specialPolicyMode = event.currentTarget.value as SpecialPolicyMode;

    setInput({
      ...input,
      specialPolicyMode,
      childAgeMonths: specialPolicyMode === "sixPlusSix" ? input.childAgeMonths : "",
      partnerUsedParentalLeave:
        specialPolicyMode === "sixPlusSix" ? input.partnerUsedParentalLeave : "",
      partnerLeaveMonths:
        specialPolicyMode === "sixPlusSix" ? input.partnerLeaveMonths : "",
      sameChild: specialPolicyMode === "sixPlusSix" ? input.sameChild : "",
      isSingleParent:
        specialPolicyMode === "singleParent" ? input.isSingleParent : "",
    });
    setErrors([]);
    setResult(null);
    setFeedback("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = calculateParentalLeaveWithSpecialPolicy(parseInputs(input));

    if (!response.success) {
      setErrors(response.errors);
      setResult(null);
      setFeedback("");

      const firstError = response.errors[0];
      if (firstError?.field === "monthlyOrdinaryWage") {
        wageInputRef.current?.focus();
      } else if (firstError?.field === "leaveMonths") {
        monthsInputRef.current?.focus();
      }
      return;
    }

    setErrors([]);
    setResult(buildParentalLeaveResultPresentation(response.data));
    setFeedback("계산 결과가 업데이트되었습니다.");
  }

  function handleReset() {
    setInput(initialInputs);
    setErrors([]);
    setResult(null);
    setFeedback("");
    wageInputRef.current?.focus();
  }

  async function handleCopy() {
    if (!result) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        setFeedback("복사 기능을 사용할 수 없습니다.");
        return;
      }

      await navigator.clipboard.writeText(buildResultText(result));
      setFeedback("결과를 클립보드에 복사했습니다.");
    } catch {
      setFeedback("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  }

  async function handleShare() {
    if (!result) {
      return;
    }

    try {
      const text = buildResultText(result);

      if (navigator.share) {
        await navigator.share({
          title: result.title,
          text,
        });
        setFeedback("공유 창을 열었습니다.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setFeedback("공유 기능이 없어 결과를 복사했습니다.");
        return;
      }

      setFeedback("공유와 복사를 사용할 수 없습니다.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setFeedback("공유를 취소했습니다.");
        return;
      }
      setFeedback("공유를 완료하지 못했습니다.");
    }
  }

  const wageErrors = errorsByField.monthlyOrdinaryWage ?? [];
  const monthErrors = errorsByField.leaveMonths ?? [];

  return (
    <>
      <aside className={styles.policyNotice} aria-label="육아휴직급여 계산 기준">
        <strong>일반 육아휴직급여 계산</strong>
        <p>
          계산 기준일: {PARENTAL_LEAVE_POLICY_2026.basisDate}. 일반 계산을
          기본으로 하며, 부모 함께 육아휴직제 6+6 또는 한부모 특례 조건을
          선택하면 해당 조건의 예상액과 적용 여부 안내를 함께 표시합니다.
        </p>
      </aside>

      <div className={styles.calculator}>
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>01 · 입력</p>
              <h2>육아휴직급여 계산 정보를 입력하세요</h2>
            </div>
            <p>예상 계산</p>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label htmlFor="monthlyOrdinaryWage">월 통상임금</label>
              <div
                className={`${styles.inputShell} ${
                  wageErrors.length > 0 ? styles.inputShellError : ""
                }`}
              >
                <input
                  ref={wageInputRef}
                  id="monthlyOrdinaryWage"
                  name="monthlyOrdinaryWage"
                  inputMode="numeric"
                  autoComplete="off"
                  value={input.monthlyOrdinaryWage}
                  onChange={handleChange}
                  aria-invalid={wageErrors.length > 0}
                  aria-describedby="monthlyOrdinaryWage-description monthlyOrdinaryWage-error"
                />
                <span aria-hidden="true">원</span>
              </div>
              <p
                className={styles.fieldDescription}
                id="monthlyOrdinaryWage-description"
              >
                육아휴직 개시일 기준 월 통상임금을 입력합니다.
              </p>
              {wageErrors.length > 0 && (
                <p className={styles.fieldError} id="monthlyOrdinaryWage-error">
                  {wageErrors.map(getErrorMessage).join(" ")}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="leaveMonths">육아휴직 사용 개월 수</label>
              <div
                className={`${styles.inputShell} ${
                  monthErrors.length > 0 ? styles.inputShellError : ""
                }`}
              >
                <input
                  ref={monthsInputRef}
                  id="leaveMonths"
                  name="leaveMonths"
                  inputMode="numeric"
                  autoComplete="off"
                  value={input.leaveMonths}
                  onChange={handleChange}
                  aria-invalid={monthErrors.length > 0}
                  aria-describedby="leaveMonths-description leaveMonths-error"
                />
                <span aria-hidden="true">개월</span>
              </div>
              <p className={styles.fieldDescription} id="leaveMonths-description">
                1개월부터 12개월까지 1개월 단위로 계산합니다.
              </p>
              {monthErrors.length > 0 && (
                <p className={styles.fieldError} id="leaveMonths-error">
                  {monthErrors.map(getErrorMessage).join(" ")}
                </p>
              )}
            </div>

            <div className={styles.disabledOption} aria-label="특례 적용 안내">
              <strong>특례 적용 안내</strong>
              <p>
                특례 조건이 충분하지 않거나 여러 특례가 겹치면, 일반
                육아휴직급여 기준으로 계산한 구간과 확인할 항목을 따로
                보여줍니다.
              </p>
            </div>

            <fieldset className={styles.field}>
              <legend className={styles.legend}>특례 검토 방식</legend>
              <div className={styles.segmented}>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="specialPolicyMode"
                    value="general"
                    checked={input.specialPolicyMode === "general"}
                    onChange={handleSpecialPolicyChange}
                  />
                  <strong>일반 계산만 사용</strong>
                  <span>특례 조건을 적용하지 않고 일반 기준으로 계산합니다.</span>
                </label>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="specialPolicyMode"
                    value="sixPlusSix"
                    checked={input.specialPolicyMode === "sixPlusSix"}
                    onChange={handleSpecialPolicyChange}
                  />
                  <strong>6+6 특례 검토</strong>
                  <span>같은 자녀, 배우자 사용 여부와 공통 사용기간을 확인합니다.</span>
                </label>
                <label className={styles.option}>
                  <input
                    type="radio"
                    name="specialPolicyMode"
                    value="singleParent"
                    checked={input.specialPolicyMode === "singleParent"}
                    onChange={handleSpecialPolicyChange}
                  />
                  <strong>한부모 특례 검토</strong>
                  <span>한부모 해당 여부가 확인된 경우만 특례를 검토합니다.</span>
                </label>
              </div>
            </fieldset>

            {input.specialPolicyMode === "sixPlusSix" && (
              <fieldset className={styles.field}>
                <legend className={styles.legend}>6+6 특례 확인 입력</legend>
                <div className={styles.specialGrid}>
                  <div>
                    <label htmlFor="childAgeMonths">자녀 월령</label>
                    <div className={styles.inputShell}>
                      <input
                        id="childAgeMonths"
                        name="childAgeMonths"
                        inputMode="numeric"
                        autoComplete="off"
                        value={input.childAgeMonths}
                        onChange={handleChange}
                        aria-describedby="childAgeMonths-description"
                      />
                      <span aria-hidden="true">개월</span>
                    </div>
                    <p
                      className={styles.fieldDescription}
                      id="childAgeMonths-description"
                    >
                      생후 18개월 이내 여부를 확인합니다.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="partnerLeaveMonths">배우자 사용 개월 수</label>
                    <div className={styles.inputShell}>
                      <input
                        id="partnerLeaveMonths"
                        name="partnerLeaveMonths"
                        inputMode="numeric"
                        autoComplete="off"
                        value={input.partnerLeaveMonths}
                        onChange={handleChange}
                        aria-describedby="partnerLeaveMonths-description"
                      />
                      <span aria-hidden="true">개월</span>
                    </div>
                    <p
                      className={styles.fieldDescription}
                      id="partnerLeaveMonths-description"
                    >
                      공통 적용 기간 판단에 사용하며 1~6개월 범위로 검토합니다.
                    </p>
                  </div>
                </div>

                <div className={styles.radioGrid}>
                  <fieldset className={styles.inlineFieldset}>
                    <legend>배우자 육아휴직 사용 여부</legend>
                    {[
                      ["yes", "예"],
                      ["no", "아니오"],
                      ["unknown", "모름"],
                    ].map(([value, label]) => (
                      <label className={styles.inlineOption} key={value}>
                        <input
                          type="radio"
                          name="partnerUsedParentalLeave"
                          value={value}
                          checked={input.partnerUsedParentalLeave === value}
                          onChange={handleChange}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>

                  <fieldset className={styles.inlineFieldset}>
                    <legend>같은 자녀 기준 여부</legend>
                    {[
                      ["yes", "예"],
                      ["no", "아니오"],
                      ["unknown", "모름"],
                    ].map(([value, label]) => (
                      <label className={styles.inlineOption} key={value}>
                        <input
                          type="radio"
                          name="sameChild"
                          value={value}
                          checked={input.sameChild === value}
                          onChange={handleChange}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                </div>
              </fieldset>
            )}

            {input.specialPolicyMode === "singleParent" && (
              <fieldset className={styles.field}>
                <legend className={styles.legend}>한부모 특례 확인 입력</legend>
                <fieldset className={styles.inlineFieldset}>
                  <legend>한부모 해당 여부</legend>
                  {[
                    ["yes", "예"],
                    ["no", "아니오"],
                    ["unknown", "모름"],
                  ].map(([value, label]) => (
                    <label className={styles.inlineOption} key={value}>
                      <input
                        type="radio"
                        name="isSingleParent"
                        value={value}
                        checked={input.isSingleParent === value}
                        onChange={handleChange}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
                <p className={styles.fieldDescription}>
                  한부모 여부가 비어 있거나 모름이면 금액을 임의 추정하지 않고
                  보완 입력 안내를 표시합니다.
                </p>
              </fieldset>
            )}
          </div>

          {errors.length > 0 && (
            <div className={styles.errorSummary} role="alert">
              입력값을 확인해 주세요.
              <ul>
                {errors.map((error) => (
                  <li key={`${error.field}-${error.code}`}>
                    {getErrorMessage(error)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.calculateButton} type="submit">
              육아휴직급여 계산하기
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

        <section
          className={styles.resultCard}
          aria-labelledby="parental-leave-result-heading"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.step}>02 · 결과</p>
              <h2 id="parental-leave-result-heading">육아휴직급여 예상 결과</h2>
            </div>
          </div>

          <div className={styles.resultLive} aria-live="polite">
            {!result && errors.length === 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">₩</span>
                <p>입력값을 채운 뒤 계산하면 월별 예상 육아휴직급여를 보여드립니다.</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className={styles.emptyResult}>
                <span aria-hidden="true">!</span>
                <p>오류를 수정하면 결과를 확인할 수 있습니다.</p>
              </div>
            )}

            {result && (
              <div>
                <div className={styles.statusNotice} role="status">
                  {result.primaryNotice}
                </div>

                <div className={styles.primaryResult}>
                  <p>총 예상 수령액</p>
                  <strong>{formatWon(result.totalEstimatedAmount)}</strong>
                  <span>{result.title} · 확정 지급액이 아닌 예상값</span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>적용된 계산 방식</dt>
                    <dd>{result.appliedPolicyLabel}</dd>
                  </div>
                  <div>
                    <dt>계산 기준일</dt>
                    <dd>{result.policyDate}</dd>
                  </div>
                  <div>
                    <dt>입력 부족 항목</dt>
                    <dd>
                      {result.missingInputMessages.length > 0
                        ? `${result.missingInputMessages.length}개`
                        : "없음"}
                    </dd>
                  </div>
                  <div>
                    <dt>일반 기준 적용 구간 수</dt>
                    <dd>
                      {result.fallbackRanges.length > 0
                        ? `${result.fallbackRanges.length}개`
                        : "없음"}
                    </dd>
                  </div>
                </dl>

                {(result.notAppliedPolicyLabels.length > 0 ||
                  result.missingInputMessages.length > 0 ||
                  result.reasonMessages.length > 0 ||
                  result.warningMessages.length > 0 ||
                  result.fallbackRanges.length > 0) && (
                  <div className={styles.detailSection}>
                    <h3>특례 검토 안내</h3>
                    {result.notAppliedPolicyLabels.length > 0 && (
                      <p className={styles.disclaimer}>
                        적용되지 않은 계산 방식:{" "}
                        {result.notAppliedPolicyLabels.join(", ")}
                      </p>
                    )}
                    {result.missingInputMessages.length > 0 && (
                      <div
                        className={styles.noticeBox}
                        role="status"
                        aria-label="입력 부족 항목"
                      >
                        <strong>보완 입력</strong>
                        <ul>
                          {result.missingInputMessages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.reasonMessages.length > 0 && (
                      <div className={styles.noticeBox} aria-label="적용 불가 사유">
                        <strong>적용 불가 또는 확인 사유</strong>
                        <ul>
                          {result.reasonMessages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.fallbackRanges.length > 0 && (
                      <div className={styles.noticeBox} aria-label="일반 기준 적용 구간">
                        <strong>일반 기준 적용 구간</strong>
                        <ul>
                          {result.fallbackRanges.map((range) => (
                            <li key={`${range.fromMonth}-${range.toMonth}`}>
                              {range.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.warningMessages.length > 0 && (
                      <div className={styles.noticeBox} aria-label="검토 안내">
                        <strong>검토 안내</strong>
                        <ul>
                          {result.warningMessages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.detailSection}>
                  <h3>월별 예상 육아휴직급여</h3>
                  <div className={styles.tableScroll}>
                    <table className={styles.dataTable}>
                      <caption>월별 예상 육아휴직급여</caption>
                      <thead>
                        <tr>
                          <th scope="col">개월</th>
                          <th scope="col">계산 방식</th>
                          <th scope="col">예상액</th>
                          <th scope="col">구간 안내</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.monthlyRows.map((item) => (
                          <tr key={item.month}>
                            <th scope="row">{item.month}개월차</th>
                            <td>{item.policyLabel}</td>
                            <td>{formatWon(item.amount)}</td>
                            <td>{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h3>결과 해석</h3>
                  <p className={styles.disclaimer}>
                    {result.disclaimer}
                  </p>
                  <p className={styles.disclaimer}>
                    공식 출처: {result.sourceNames.join(", ")}
                  </p>
                </div>

                <div className={styles.resultActions}>
                  <button type="button" onClick={handleCopy}>
                    결과 복사
                  </button>
                  <button type="button" onClick={handleShare}>
                    결과 공유
                  </button>
                </div>
              </div>
            )}

            {feedback && <p className={styles.feedback}>{feedback}</p>}
          </div>
        </section>
      </div>
    </>
  );
}

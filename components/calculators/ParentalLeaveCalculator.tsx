"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import {
  calculateParentalLeaveBenefit,
  PARENTAL_LEAVE_POLICY_2026,
  type ParentalLeaveInputField,
  type ParentalLeaveResult,
  type ParentalLeaveValidationError,
} from "@/lib/calculators/parental-leave/parentalLeave";
import {
  copyParentalLeaveResult,
  formatRate,
  formatWon,
  shareParentalLeaveResult,
} from "./parentalLeaveClientUtils";
import styles from "./ParentalLeaveCalculator.module.css";

type RawInputs = {
  monthlyOrdinaryWage: string;
  leaveMonths: string;
};

const initialInputs: RawInputs = {
  monthlyOrdinaryWage: "",
  leaveMonths: "",
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

function parseInputs(input: RawInputs) {
  return {
    monthlyOrdinaryWage:
      input.monthlyOrdinaryWage.trim() === ""
        ? undefined
        : Number(input.monthlyOrdinaryWage.replaceAll(",", "")),
    leaveMonths:
      input.leaveMonths.trim() === "" ? undefined : Number(input.leaveMonths),
  };
}

function getErrorMessage(error: ParentalLeaveValidationError): string {
  return error.message || `${fieldLabels[error.field]} 입력값을 확인해 주세요.`;
}

function getResultStatusMessage(result: ParentalLeaveResult): string {
  const hasCap = result.monthlyBenefits.some((item) => item.capApplied);
  const hasFloor = result.monthlyBenefits.some((item) => item.floorApplied);

  if (hasCap && hasFloor) {
    return "월별 구간에 따라 상한액과 하한액이 함께 적용된 개월이 있습니다.";
  }

  if (hasCap) {
    return "입력한 통상임금이 높아 일부 개월에 상한액이 적용되었습니다.";
  }

  if (hasFloor) {
    return "계산 전 금액이 낮아 일부 개월에 하한액이 적용되었습니다.";
  }

  return "입력값이 구간별 상한액과 하한액 사이에 있어 산식 금액을 그대로 표시합니다.";
}

export function ParentalLeaveCalculator() {
  const [input, setInput] = useState<RawInputs>(initialInputs);
  const [errors, setErrors] = useState<ParentalLeaveValidationError[]>([]);
  const [result, setResult] = useState<ParentalLeaveResult | null>(null);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = calculateParentalLeaveBenefit(parseInputs(input));

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
    setResult(response.data);
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
      setFeedback(
        (await copyParentalLeaveResult(result))
          ? "결과를 클립보드에 복사했습니다."
          : "복사 기능을 사용할 수 없습니다.",
      );
    } catch {
      setFeedback("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  }

  async function handleShare() {
    if (!result) {
      return;
    }

    try {
      const status = await shareParentalLeaveResult(result);
      setFeedback(
        status === "shared"
          ? "공유 창을 열었습니다."
          : status === "copied"
            ? "공유 기능이 없어 결과를 복사했습니다."
            : "공유와 복사를 사용할 수 없습니다.",
      );
    } catch {
      setFeedback("공유를 완료하지 못했습니다.");
    }
  }

  const wageErrors = errorsByField.monthlyOrdinaryWage ?? [];
  const monthErrors = errorsByField.leaveMonths ?? [];

  return (
    <>
      <aside className={styles.policyNotice} aria-label="육아휴직급여 계산 기준">
        <strong>일반 육아휴직급여 1차 계산</strong>
        <p>
          계산 기준일: {PARENTAL_LEAVE_POLICY_2026.basisDate}. 부모 함께
          육아휴직제 6+6, 한부모 특례는 1차 계산 범위에 포함하지 않습니다.
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

            <div className={styles.disabledOption} aria-label="1차 제외 특례">
              <strong>특례 계산 제외</strong>
              <p>
                부모 함께 육아휴직제 6+6, 한부모 육아휴직 특례는 1차 계산
                범위에 포함하지 않습니다.
              </p>
            </div>
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
                  {getResultStatusMessage(result)}
                </div>

                <div className={styles.primaryResult}>
                  <p>총 예상 수령액</p>
                  <strong>{formatWon(result.totalEstimatedAmount)}</strong>
                  <span>
                    {result.leaveMonths}개월 합계 · 확정 지급액이 아닌 예상값
                  </span>
                </div>

                <dl className={styles.summaryGrid} aria-label="결과 요약">
                  <div>
                    <dt>월 통상임금</dt>
                    <dd>{formatWon(result.monthlyOrdinaryWage)}</dd>
                  </div>
                  <div>
                    <dt>계산 기준일</dt>
                    <dd>{result.basisDate}</dd>
                  </div>
                  <div>
                    <dt>상한 적용 개월</dt>
                    <dd>
                      {
                        result.monthlyBenefits.filter((item) => item.capApplied)
                          .length
                      }
                      개월
                    </dd>
                  </div>
                  <div>
                    <dt>하한 적용 개월</dt>
                    <dd>
                      {
                        result.monthlyBenefits.filter((item) => item.floorApplied)
                          .length
                      }
                      개월
                    </dd>
                  </div>
                </dl>

                <div className={styles.detailSection}>
                  <h3>월별 예상 육아휴직급여</h3>
                  <div className={styles.tableScroll}>
                    <table className={styles.dataTable}>
                      <caption>월별 예상 육아휴직급여</caption>
                      <thead>
                        <tr>
                          <th scope="col">개월</th>
                          <th scope="col">지급률</th>
                          <th scope="col">예상액</th>
                          <th scope="col">상한</th>
                          <th scope="col">하한</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.monthlyBenefits.map((item) => (
                          <tr key={item.month}>
                            <th scope="row">{item.month}개월차</th>
                            <td>{formatRate(item.rate)}</td>
                            <td>{formatWon(item.estimatedAmount)}</td>
                            <td>{item.capApplied ? "적용" : "미적용"}</td>
                            <td>{item.floorApplied ? "적용" : "미적용"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h3>결과 해석</h3>
                  <p className={styles.disclaimer}>
                    {result.interpretation} {result.disclaimer}
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

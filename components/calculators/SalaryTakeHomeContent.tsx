import Link from "next/link";
import { SALARY_TAKE_HOME_POLICY_2026 } from "@/lib/calculators/salary-take-home/policy";
import {
  salaryTakeHomeCalculationCriteria,
  salaryTakeHomeExampleInputItems,
  salaryTakeHomeExampleResultItems,
  salaryTakeHomeExclusions,
  salaryTakeHomeFaqs,
  salaryTakeHomeSources,
} from "./salaryTakeHomeContentData";
import styles from "./SalaryTakeHomeContent.module.css";

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function SalaryTakeHomeContent() {
  const policy = SALARY_TAKE_HOME_POLICY_2026;

  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            실수령액은 입력값과 현재 공개 정책을 기준으로 계산한 예상치이며,
            실제 급여명세서의 확정 금액은 아닙니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>월 예상 실수령액</h3>
            <p>월 급여에서 여섯 가지 공제 항목을 차감한 예상 금액입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>연간 예상 실수령액</h3>
            <p>
              월 예상 실수령액의 12배이며 상여나 월별 급여 변동은 포함하지
              않습니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>입력 조건의 영향</h3>
            <p>
              비과세액, 공제대상 가족 수와 자녀 수에 따라 과세 급여와 소득세가
              달라질 수 있습니다.
            </p>
          </article>
        </div>
        <p className={styles.note}>
          저소득 구간에서는 소득세가 0원일 수 있습니다. 국민연금은
          기준소득월액 상한을 초과한 소득 전체에 계속 비례하지 않으며, 실제
          신고 보수월액과 회사별 급여 처리 방식에 따라 결과가 달라질 수
          있습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">2026년 계산 기준</h2>
          <p>
            기준 확인일은 {formatKoreanDate(policy.verifiedAt)}이며, 화면의
            정책값과 같은 데이터로 설명합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {salaryTakeHomeCalculationCriteria.map(({ title, description }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <aside className={styles.policyNotice} aria-label="국민연금 변경 안내">
          <strong>국민연금 기준소득월액 적용 안내</strong>
          <p>
            현재 하한 {formatWon(policy.nationalPension.standardMonthlyIncomeMinimum)},
            상한 {formatWon(policy.nationalPension.standardMonthlyIncomeMaximum)}
            을 {formatKoreanDate(policy.nationalPension.ceilingEffectiveFrom)}부터{" "}
            {formatKoreanDate(policy.nationalPension.ceilingEffectiveTo)}까지
            적용합니다. 2026년 7월 1일부터 기준이 변경될 예정이지만 현재
            계산에는 이후 기준을 미리 적용하지 않으며 자동 반영되지 않습니다.
          </p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>
            아래 금액은 고정 입력을 현재 계산 엔진에 적용해 빌드 시 생성한
            결과입니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {salaryTakeHomeExampleInputItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article className={styles.exampleCard}>
            <h3>예시 결과</h3>
            <dl>
              {salaryTakeHomeExampleResultItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">자동 반영되지 않는 항목과 예외</h2>
          <p>다음 조건은 현재 계산기가 자동으로 확인하거나 반영하지 않습니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {salaryTakeHomeExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {salaryTakeHomeFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <h2 id="related-title">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <Link
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/seller-margin"
          >
            <h3>판매자 마진·순이익 계산기</h3>
            <p>판매 수수료와 비용을 반영한 예상 순이익을 계산합니다.</p>
          </Link>
          <article className={styles.relatedCard}>
            <h3>퇴직금 계산기</h3>
            <span className={styles.comingSoon}>준비 중</span>
          </article>
          <article className={styles.relatedCard}>
            <h3>실업급여 계산기</h3>
            <span className={styles.comingSoon}>준비 중</span>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">공식 출처</h2>
          <p>
            {formatKoreanDate(policy.verifiedAt)}에 아래 공식 기관의 원문을
            확인했습니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {salaryTakeHomeSources.map(
            ({ organization, title, criterion, href }) => (
              <li key={href}>
                <div>
                  <strong>{organization}</strong>
                  <span>{criterion}</span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {title} 원문 보기
                </a>
              </li>
            ),
          )}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        계산 결과는 사용자가 입력한 값과 공개된 정책 기준에 따른 예상치입니다.
        실제 공제액은 회사의 급여 규정, 신고 보수월액과 개인별 가입 상태에
        따라 달라질 수 있으며 중도 입사·퇴사, 상여금, 감면·지원과 연말정산은
        별도로 반영될 수 있습니다. 이 결과는 급여명세서, 세무 신고나 기관의
        공식 산정 결과를 대체하지 않으므로 중요한 확인은 회사 급여 담당자나
        관련 기관 자료를 기준으로 해 주세요.
      </aside>
    </div>
  );
}

import Link from "next/link";
import { SEVERANCE_POLICY_2026 } from "@/lib/calculators/severance/policy";
import {
  severanceCalculationCriteria,
  severanceCautions,
  severanceFaqs,
  severanceFormulaItems,
  severanceInterpretationCards,
  severanceOfficialExampleResultItems,
  severanceOfficialExampleInputItems,
  severanceSources,
} from "./severanceContentData";
import styles from "./SeveranceContent.module.css";

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function SeveranceContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            예상 퇴직금은 입력값과 공개 정책 기준으로 계산한 참고값입니다.
            실제 지급액 확정 전에는 대상 여부와 적용 기준을 함께 확인해 주세요.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          {severanceInterpretationCards.map(({ title, description }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">계산 기준</h2>
          <p>
            기준 확인일은 {formatKoreanDate(SEVERANCE_POLICY_2026.verifiedAt)}
            이며, 퇴직금 정책 문서와 같은 값을 사용합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {severanceCalculationCriteria.map(({ title, description }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">계산식</h2>
          <p>
            현재 엔진은 평균임금과 통상임금을 비교한 뒤 법정 산식에 맞춰 예상
            퇴직금을 계산합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {severanceFormulaItems.map(({ title, description }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <aside className={styles.policyNotice} aria-label="반올림 기준 안내">
          <strong>반올림 기준</strong>
          <p>
            1일 평균임금은 1전 단위 올림, 최종 퇴직금은 원 단위 반올림으로
            표시합니다. 이는 현재 구현된 엔진과 화면 결과에 동일하게 적용됩니다.
          </p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">공식 예제 기준 계산 예시</h2>
          <p>
            고용노동부 공식 예제 기준 현재 엔진 결과는 7,868,434원입니다.
            아래 예시는 같은 입력값과 계산 흐름을 정적 빌드 시점에 고정해
            보여줍니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {severanceOfficialExampleInputItems.map(({ label, value }) => (
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
              {severanceOfficialExampleResultItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="caution-title">
        <div className={styles.sectionHeading}>
          <h2 id="caution-title">예외 및 주의사항</h2>
          <p>
            다음 항목은 현재 계산기에 자동 반영되지 않거나 사업장별 판단이
            필요한 영역입니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {severanceCautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {severanceFaqs.map(({ question, answer }) => (
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
            href="/calculators/salary"
          >
            <h3>연봉·월급 실수령액 계산기</h3>
            <p>급여 공제와 월 예상 실수령액을 함께 확인할 수 있습니다.</p>
          </Link>
          <Link
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/loan"
          >
            <h3>대출이자 계산기</h3>
            <p>월 납입액과 총이자를 상환방식별로 비교해 볼 수 있습니다.</p>
          </Link>
          <article className={styles.relatedCard}>
            <h3>실업급여 계산기</h3>
            <span className={styles.comingSoon}>준비 중</span>
          </article>
          <article className={styles.relatedCard}>
            <h3>시급·주휴·연장·야간수당 계산기</h3>
            <span className={styles.comingSoon}>준비 중</span>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">공식 출처</h2>
          <p>
            {formatKoreanDate(SEVERANCE_POLICY_2026.verifiedAt)}에 아래 공식
            기관 원문을 확인했습니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {severanceSources.map(({ organization, title, criterion, href }) => (
            <li key={href}>
              <div>
                <strong>{organization}</strong>
                <span>{criterion}</span>
              </div>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {title} 원문 보기
              </a>
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        본 계산기는 입력값 기준 예상액을 제공합니다. 실제 지급액은 회사의
        임금 항목 판단, 퇴직연금 운영 방식, 세금, 평균임금 산정 제외기간과
        개별 사정에 따라 달라질 수 있습니다. 법률 자문을 제공하는 서비스는
        아닙니다. 분쟁, 체불 또는 지급 기준 확인이 필요하면 고용노동부
        상담이나 노무·법률 전문가 확인이 필요합니다.
      </aside>
    </div>
  );
}

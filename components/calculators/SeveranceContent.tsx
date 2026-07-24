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
      <section className={styles.section} aria-labelledby="use-case-title">
        <div className={styles.sectionHeading}>
          <h2 id="use-case-title">언제 쓰는 계산기인가요?</h2>
          <p>
            퇴사 전후에 법정 퇴직금의 기본 산식과 예상 금액을 확인하고 싶을
            때 사용합니다. 계속근로기간, 주당 소정근로시간, 평균임금 산정
            자료를 함께 보아야 하므로 입력 조건을 정확히 정리하는 것이
            중요합니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>입력값 안내</h3>
            <p>
              퇴직일은 마지막 근무일 다음 날을 입력하고, 퇴직 전 3개월 임금과
              최근 1년 상여금·연차수당은 세전 금액 기준으로 입력합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>자주 틀리는 부분</h3>
            <p>
              평균임금 산정기간, 통상임금 해당 여부, 제외기간, 퇴직연금 처리
              방식은 사업장별 확인이 필요합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>사용자 우선 안내</h3>
            <p>
              결과는 예상 퇴직금을 이해하기 위한 참고값이며, 체불이나 분쟁
              판단은 고용노동부 상담 또는 전문가 확인이 필요합니다.
            </p>
          </article>
        </div>
      </section>

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
            계산기는 평균임금과 통상임금을 비교한 뒤 법정 산식에 맞춰 예상
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
            표시합니다. 이 기준은 화면의 모든 예상 계산 결과에 동일하게
            적용됩니다.
          </p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">공식 예제 기준 계산 예시</h2>
          <p>
            고용노동부 공식 예제의 입력 조건으로 계산한 예상 퇴직금은
            7,868,434원입니다. 아래에서 사용한 임금과 근속기간, 계산 결과를
            함께 확인할 수 있습니다.
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
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/salary/"
          >
            <h3>연봉 실수령액 계산기</h3>
            <p>급여 공제와 월 예상 실수령액을 함께 확인할 수 있습니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/loan/"
          >
            <h3>대출 이자 계산기</h3>
            <p>월 납입액과 총이자를 상환방식별로 비교해 볼 수 있습니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/unemployment/"
          >
            <h3>실업급여 계산기</h3>
            <p>고용보험 가입기간과 임금 기준 예상 구직급여를 계산합니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/seller-margin/"
          >
            <h3>판매자 마진 계산기</h3>
            <p>수수료와 비용을 반영한 주문 기준 예상 순이익을 계산합니다.</p>
          </a>
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

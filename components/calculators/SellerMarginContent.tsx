import {
  sellerMarginExampleInput,
  sellerMarginExampleResult,
  sellerMarginExclusions,
  sellerMarginFaqs,
  sellerMarginFormulas,
  sellerMarginPolicyCheckedAt,
  sellerMarginSources,
} from "./sellerMarginContentData";
import styles from "./SellerMarginContent.module.css";

export function SellerMarginContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="use-case-title">
        <div className={styles.sectionHeading}>
          <h2 id="use-case-title">언제 쓰는 계산기인가요?</h2>
          <p>
            온라인 판매자가 주문 1건 또는 특정 판매 묶음의 가격 구조를 점검할
            때 사용합니다. 판매가가 충분해 보여도 원가, 할인, 배송비, 플랫폼
            수수료와 결제 수수료를 함께 넣으면 실제 남는 금액이 달라질 수
            있습니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>입력값 안내</h3>
            <p>
              판매단가와 수량은 매출 기준, 개당 원가와 배송비는 판매자가
              부담하는 비용 기준으로 입력합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>자주 틀리는 부분</h3>
            <p>
              고객에게 받은 배송비와 판매자가 부담한 배송비를 같은 칸에 넣으면
              정산금액과 비용이 섞여 결과가 왜곡됩니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>사용자 우선 안내</h3>
            <p>
              계산기는 가격 결정의 근거를 정리하도록 돕는 참고 도구이며,
              광고비 집행이나 판매 전략을 권유하지 않습니다.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            결과는 입력한 주문 조건을 설명하는 지표이며, 수익성의 적정 수준을
            판단하거나 사업 결정을 권유하는 값은 아닙니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>순이익률</h3>
            <p>결제금액 중 예상 순이익이 차지하는 비율입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>원가율</h3>
            <p>상품 판매금액 중 상품 원가 총액이 차지하는 비율입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>총수수료율</h3>
            <p>
              결제금액 중 플랫폼 수수료와 결제 수수료 합계가 차지하는
              비율입니다.
            </p>
          </article>
        </div>
        <p className={styles.roundingNote}>
          예상 순이익이 0원보다 크면 흑자, 작으면 적자, 같으면 손익분기로
          표시됩니다. 실제 정산액은 플랫폼 정책과 정산 기준에 따라 달라질 수
          있습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">계산 기준과 계산식</h2>
          <p>
            수수료율은 퍼센트 단위로 입력하며, 각 수수료를 원 단위로 반올림한
            뒤 정산금액과 순이익을 계산합니다. 기준 확인일은{" "}
            {sellerMarginPolicyCheckedAt}입니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {sellerMarginFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.roundingNote}>
          반환되는 금액은 원 단위 정수, 비율은 소수점 둘째 자리까지
          반올림합니다. 플랫폼별 절사·반올림 정책은 자동 반영하지 않습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>아래 예시는 주문 1건을 기준으로 한 고정 계산 사례입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {sellerMarginExampleInput.map(({ label, value }) => (
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
              {sellerMarginExampleResult.map(({ label, value }) => (
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
          <h2 id="exclusion-title">자동 반영되지 않는 항목</h2>
          <p>
            아래 항목은 계산기가 자동으로 확인하거나 적용하지 않습니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {sellerMarginExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="difference-title">
        <div className={styles.sectionHeading}>
          <h2 id="difference-title">실제 정산·신고 금액과 달라지는 이유</h2>
          <p>
            이 계산기는 주문 단위의 세전 예상 순이익을 계산합니다. 실제 플랫폼
            정산액, 부가가치세 신고, 종합소득세 또는 법인세 신고 금액은 서로
            다른 기준을 사용하므로 결과가 같지 않을 수 있습니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>플랫폼 정산 기준</h3>
            <p>
              카테고리별 수수료, 쿠폰 분담, 광고 상품, 반품·환불, 정산 보류와
              정산 주기에 따라 실제 지급액이 달라질 수 있습니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>세금 신고 기준</h3>
            <p>
              부가가치세, 종합소득세, 법인세는 매출·매입·필요경비와 사업자
              유형을 따로 판단하므로 이 계산기의 순이익과 직접 일치하지
              않습니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>비용 배분 기준</h3>
            <p>
              광고비, 포장비, 보관료처럼 주문별로 나누기 어려운 비용은 사용자가
              정한 배분 방식에 따라 입력값과 결과가 달라집니다.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {sellerMarginFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">참고 출처</h2>
          <p>
            {sellerMarginPolicyCheckedAt}에 아래 공식 기관 자료를 확인했습니다.
            판매 플랫폼별 수수료와 정산 내역은 각 플랫폼 판매자센터의 최신
            공지를 함께 확인해야 합니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {sellerMarginSources.map(
            ({ organization, title, criterion, checkedAt, href }) => (
              <li key={href}>
                <div>
                  <strong>{organization}</strong>
                  <span>{criterion}</span>
                  <span>확인 기준일: {checkedAt}</span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {title} 원문 보기
                </a>
              </li>
            ),
          )}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <h2 id="related-title">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/"
          >
            <h3>전체 계산기 목록</h3>
            <p>현재 이용할 수 있는 계산기를 확인합니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/vat-profit/"
          >
            <h3>부가세 계산기</h3>
            <p>공급가액과 매입세액 기준 예상 부가세를 따로 확인합니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/loan/"
          >
            <h3>대출 이자 계산기</h3>
            <p>사업 자금 대출의 월 납입액과 총이자를 비교합니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/salary/"
          >
            <h3>연봉 실수령액 계산기</h3>
            <p>급여 공제와 월 예상 실수령액을 함께 확인합니다.</p>
          </a>
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        계산 결과는 사용자가 입력한 값을 기준으로 한 예상값이며 플랫폼 정책과
        실제 정산 기준이 우선합니다. 세무 신고나 회계 판단을 위한 확정 자료가
        아니므로, 중요한 정산·가격·세무 결정 전에는 플랫폼 정산 내역이나 관련
        전문가의 확인을 권장합니다.
      </aside>
    </div>
  );
}

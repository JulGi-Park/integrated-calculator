import styles from "./CardInstallmentCalculator.module.css";

const criteria = [
  "월 수수료율 = 연 할부 수수료율 / 100 / 12",
  "각 회차 수수료 = 해당 월 시작 잔여 원금 × 월 수수료율을 원 단위 반올림",
  "1회차부터 마지막 전 회차 원금은 구매금액 / 할부 개월 수를 원 단위 내림",
  "마지막 회차 원금은 구매금액에서 이전 회차 원금 합계를 뺀 금액으로 보정",
  "총 수수료는 월별 수수료 합계이며 일시불 대비 추가 부담액과 같습니다.",
];

const exclusions = [
  "무이자 할부와 부분 무이자",
  "카드사·가맹점 이벤트, 청구 할인, 즉시 할인",
  "포인트 사용, 캐시백, 선결제, 중도상환",
  "연체이자, 결제일별 일수 차이, 카드사 내부 원 단위 처리 차이",
];

export const cardInstallmentFaqs = [
  {
    question: "카드사 앱의 실제 금액과 다를 수 있나요?",
    answer:
      "네. 카드사별 실제 할부 수수료율은 카드사, 회원 등급, 결제 시점, 가맹점, 이벤트에 따라 달라질 수 있습니다.",
  },
  {
    question: "0%를 입력하면 어떻게 계산되나요?",
    answer:
      "연 할부 수수료율 0%는 무이자 할부로 처리하며, 총 수수료와 추가 부담액을 0원으로 계산합니다.",
  },
  {
    question: "부분 무이자는 계산할 수 있나요?",
    answer:
      "이번 1차 계산기는 전체 기간에 같은 연 수수료율을 적용하는 단순 추정 도구입니다. 부분 무이자 조건은 직접 반영하지 않습니다.",
  },
  {
    question: "확정 청구금액으로 볼 수 있나요?",
    answer:
      "아니요. 실제 결제 전 카드사 공식 수수료율과 청구 조건을 확인해야 합니다.",
  },
];

export function CardInstallmentContent() {
  return (
    <div className={styles.content}>
      <section className={styles.contentSection} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">계산 기준</h2>
          <p>코드, 테스트, 화면 설명이 같은 기준을 사용합니다.</p>
        </div>
        <ul className={styles.pointList}>
          {criteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.contentSection} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>1,200,000원을 12개월, 연 12%로 결제하는 경우입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article>
            <h3>입력</h3>
            <dl>
              <div>
                <dt>구매금액</dt>
                <dd>1,200,000원</dd>
              </div>
              <div>
                <dt>할부 개월 수</dt>
                <dd>12개월</dd>
              </div>
              <div>
                <dt>연 수수료율</dt>
                <dd>12%</dd>
              </div>
            </dl>
          </article>
          <article>
            <h3>결과</h3>
            <dl>
              <div>
                <dt>월 수수료율</dt>
                <dd>1%</dd>
              </div>
              <div>
                <dt>월별 수수료</dt>
                <dd>12,000원부터 1,000원까지 감소</dd>
              </div>
              <div>
                <dt>총 수수료</dt>
                <dd>78,000원</dd>
              </div>
              <div>
                <dt>총 납부액</dt>
                <dd>1,278,000원</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.contentSection} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">적용되지 않는 예외</h2>
          <p>아래 조건은 기본 계산에 포함하지 않습니다.</p>
        </div>
        <ul className={styles.pointList}>
          {exclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.contentSection} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {cardInstallmentFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.contentSection} aria-labelledby="source-title">
        <div className={styles.sectionHeading}>
          <h2 id="source-title">공식 출처 또는 계산 기준</h2>
          <p>카드사별 실제 수수료율은 결제 전 공식 채널에서 확인해야 합니다.</p>
        </div>
        <p className={styles.bodyText}>
          이 계산기는 사용자가 입력한 연 할부 수수료율을 기준으로 잔여 원금
          방식의 월별 예상 수수료를 계산합니다. 실제 수수료율은 카드사, 회원
          등급, 결제 시점, 가맹점, 이벤트에 따라 달라질 수 있으므로 카드사
          앱·홈페이지·고객센터의 공식 수수료율과 청구 조건을 우선 확인하세요.
        </p>
      </section>

      <section className={styles.contentSection} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <h2 id="related-title">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <a className={styles.relatedCard} href="/calculators/seller-margin/">
            <h3>판매자 마진 계산기</h3>
            <p>수수료와 비용을 반영한 예상 순이익을 계산합니다.</p>
          </a>
          <a className={styles.relatedCard} href="/calculators/loan/">
            <h3>대출 이자 계산기</h3>
            <p>대출 상환 방식별 총이자와 월 납입액을 비교합니다.</p>
          </a>
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="면책 문구">
        계산 결과는 입력값 기준의 단순 추정치이며 확정 청구금액이 아닙니다.
        실제 결제 전 카드사 공식 수수료율, 무이자·부분 무이자 조건, 할인,
        포인트, 선결제, 연체 관련 조건을 확인하세요. 이 도구는 금융상품 가입
        또는 특정 결제 방식 선택을 권유하지 않습니다.
      </aside>
    </div>
  );
}

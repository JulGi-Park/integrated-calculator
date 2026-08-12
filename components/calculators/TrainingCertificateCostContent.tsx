import {
  trainingCertificateCostExampleInput,
  trainingCertificateCostExampleResult,
  trainingCertificateCostFaqs,
  trainingCertificateCostFormulaItems,
  trainingCertificateCostSeo,
  trainingCertificateCostSources,
} from "./trainingCertificateCostContentData";
import styles from "./TrainingCertificateCostContent.module.css";

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

function formatWon(value: number): string {
  return wonFormatter.format(value) + "원";
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return year + "년 " + month + "월 " + day + "일";
}

export function TrainingCertificateCostContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="cost-method-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>계산 방법</p>
          <h2 id="cost-method-heading">
            국비지원 자격증 비용은 어떻게 계산하나요?
          </h2>
          <p>
            고용24에서 확인한 훈련비 본인부담액에 자격증 취득까지 필요한
            시험·교재·이동 비용을 더합니다. 이 계산기는 국민내일배움카드
            지원 자격이나 과정 지원 여부를 판정하지 않습니다.
          </p>
        </div>
        <div className={styles.formula} aria-label="총 본인부담 예상액 계산식">
          {trainingCertificateCostFormulaItems.map((item, index) => (
            <span key={item}>
              {index > 0 && <b aria-hidden="true">+</b>}
              {item}
            </span>
          ))}
        </div>
      </section>

      <div className={styles.twoColumn}>
        <section
          className={styles.section}
          aria-labelledby="self-pay-explanation-heading"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>훈련비 확인</p>
            <h2 id="self-pay-explanation-heading">
              내일배움카드 자비부담금이란?
            </h2>
          </div>
          <p>
            국민내일배움카드는 직업능력개발훈련의 훈련비를 지원하지만,
            정부 지원분을 제외한 본인부담금이 생길 수 있습니다. 고용24
            안내에 따르면 부담 수준은 훈련과정의 직종과 참여 유형 등에 따라
            달라질 수 있으므로 하나의 고정 비율을 모든 과정에 적용하면 안
            됩니다.
          </p>
        </section>

        <section
          className={styles.section}
          aria-labelledby="additional-cost-heading"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>추가 비용</p>
            <h2 id="additional-cost-heading">
              국비지원이어도 추가 비용이 발생할 수 있나요?
            </h2>
          </div>
          <p>
            과정에 따라 시험 응시료, 교재비, 실습·재료비, 교통비, 식비,
            기타 비용이 별도로 들 수 있습니다. 모든 과정에서 같은 항목이
            발생하는 것은 아니므로 실제 부담할 항목만 입력하세요.
          </p>
        </section>
      </div>

      <section className={styles.section} aria-labelledby="work24-guide-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>공식 서비스 확인</p>
          <h2 id="work24-guide-heading">고용24에서 자비부담액 확인하기</h2>
          <p>
            2026년 8월 12일 확인 기준의 공식 화면 명칭입니다. 검색 결과의
            금액은 일반 훈련생 기준으로 표시될 수 있으므로 과정 상세에서
            본인에게 적용되는 금액을 다시 확인하세요.
          </p>
        </div>
        <ol className={styles.steps}>
          <li>
            고용24에서 <strong>직업 능력 개발</strong> →{" "}
            <strong>훈련 찾기·신청</strong> → <strong>훈련 통합검색</strong>으로
            이동합니다.
          </li>
          <li>훈련과정명·자격증·지역 등의 조건으로 원하는 과정을 찾습니다.</li>
          <li>
            과정 상세의 <strong>훈련비</strong> 영역에서{" "}
            <strong>자비부담액보기</strong>를 선택해 적용 금액을 확인합니다.
          </li>
          <li>
            확인한 총 훈련비와 본인부담 훈련비를 위 계산기에 입력합니다.
          </li>
        </ol>
      </section>

      <div className={styles.twoColumn}>
        <section className={styles.section} aria-labelledby="exam-fee-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>시험 비용</p>
            <h2 id="exam-fee-heading">시험 응시료도 자동으로 포함되나요?</h2>
          </div>
          <p>
            자동으로 포함되지 않습니다. 실제 부담할 것으로 예상하는 1회
            응시료와 응시 횟수를 직접 입력합니다. 응시료 지원 여부는
            훈련과정과 시험 시행기관의 안내를 확인하세요.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="retry-cost-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>재응시 비교</p>
            <h2 id="retry-cost-heading">재응시하면 비용은 어떻게 달라지나요?</h2>
          </div>
          <p>
            다른 비용이 같다면 한 번 더 응시할 때마다 입력한 1회 응시료만큼
            예상비용이 증가합니다. 1회 응시료가 50,000원이면 2회 응시는
            1회보다 50,000원, 3회 응시는 2회보다 50,000원 더 듭니다. 실제
            재응시 여부나 합격 가능성은 예측하지 않습니다.
          </p>
        </section>
      </div>

      <section className={styles.section} aria-labelledby="example-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>계산 예시</p>
          <h2 id="example-heading">국비지원 자격증 취득비용 계산 예시</h2>
          <p>
            아래 예시는 본문과 같은 계산 엔진으로 검증한 값입니다. 개인별
            과정 조건과 실제 지출에 따라 결과는 달라질 수 있습니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <div>
            <h3>입력</h3>
            <dl>
              <div><dt>총 훈련비</dt><dd>{formatWon(trainingCertificateCostExampleInput.totalTrainingCost)}</dd></div>
              <div><dt>본인부담 훈련비</dt><dd>{formatWon(trainingCertificateCostExampleInput.trainingSelfPayAmount)}</dd></div>
              <div><dt>시험 응시료</dt><dd>{formatWon(trainingCertificateCostExampleInput.examFee)}</dd></div>
              <div><dt>예상 응시 횟수</dt><dd>{trainingCertificateCostExampleInput.expectedExamAttempts}회</dd></div>
              <div><dt>교재비</dt><dd>{formatWon(trainingCertificateCostExampleInput.textbookCost)}</dd></div>
              <div><dt>실습·재료비</dt><dd>{formatWon(trainingCertificateCostExampleInput.practiceMaterialCost)}</dd></div>
              <div><dt>교통비</dt><dd>{formatWon(trainingCertificateCostExampleInput.transportationCost)}</dd></div>
              <div><dt>식비·기타 비용</dt><dd>각 0원</dd></div>
            </dl>
          </div>
          <div className={styles.exampleResult}>
            <h3>예상 결과</h3>
            <dl>
              <div><dt>시험 응시비</dt><dd>{formatWon(trainingCertificateCostExampleResult.totalExamCost)}</dd></div>
              <div><dt>부대비용</dt><dd>{formatWon(trainingCertificateCostExampleResult.ancillaryCost)}</dd></div>
              <div><dt>국비지원 예상액</dt><dd>{formatWon(trainingCertificateCostExampleResult.estimatedGovernmentSupportAmount)}</dd></div>
              <div><dt>국비지원 전 예상 취득비용</dt><dd>{formatWon(trainingCertificateCostExampleResult.estimatedTotalCostWithoutSupport)}</dd></div>
              <div className={styles.exampleTotal}><dt>총 본인부담 예상액</dt><dd>{formatWon(trainingCertificateCostExampleResult.estimatedTotalOutOfPocket)}</dd></div>
              <div><dt>예상 절감액</dt><dd>{formatWon(trainingCertificateCostExampleResult.estimatedSavingsAmount)}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="limits-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>결과 해석</p>
          <h2 id="limits-heading">계산 결과를 확인할 때 주의하세요</h2>
        </div>
        <ul className={styles.cautionList}>
          <li>본 계산 결과는 입력값을 기준으로 한 예상값입니다.</li>
          <li>
            실제 국비지원 금액과 본인부담액은 훈련과정, 지원대상 및 적용
            기준에 따라 달라질 수 있습니다.
          </li>
          <li>
            최종 지원조건과 자비부담액은 해당 훈련과정의 공식 안내를
            확인하세요.
          </li>
          <li>
            훈련장려금, 별도 응시료 지원, 환급금 등은 기본 계산 결과에
            포함하지 않습니다.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>FAQ</p>
          <h2 id="faq-heading">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {trainingCertificateCostFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>정책 근거</p>
          <h2 id="sources-heading">공식 출처</h2>
          <p>
            정책 관련 최종 검토일:{" "}
            <time dateTime={trainingCertificateCostSeo.reviewedAt}>
              {formatKoreanDate(trainingCertificateCostSeo.reviewedAt)}
            </time>
          </p>
        </div>
        <ul className={styles.sourceList}>
          {trainingCertificateCostSources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.organization} · {source.title}
              </a>
              <p>{source.criterion}</p>
              <span>확인일 {source.verifiedAt}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

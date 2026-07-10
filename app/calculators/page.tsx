import type { Metadata } from "next";

const ogTitle = "계산기 모음 - 연봉·4대보험·대출·퇴직금 계산";
const ogDescription =
  "계산박스에서 제공하는 생활 계산기 목록입니다. 필요한 계산기를 선택해 빠르게 확인해보세요.";
const ogUrl = "https://gyesanbox.kr/calculators/";
const ogImage = "https://gyesanbox.kr/og/calculators.png";

export const metadata: Metadata = {
  title: "계산박스 계산기 목록",
  description:
    "계산박스에서 급여·근로, 금융, 사업·판매 목적에 맞는 판매자 마진, 연봉 실수령액, 4대보험, 대출 이자, 퇴직금, 실업급여 계산기를 확인하세요.",
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: ogUrl,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function CalculatorsPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-heading__eyebrow">Calculators</p>
        <h1>계산기 목록</h1>
        <p>
          현재 공개 운영 중인 계산기 6개만 모았습니다. 각 계산기는 입력값,
          계산 기준, 결과 해석과 주의사항을 함께 제공합니다.
        </p>
      </div>

      <div className="calculator-guide" aria-label="계산기 선택 안내">
        <article>
          <h2>급여·근로</h2>
          <p>연봉 실수령액, 4대보험, 퇴직금, 실업급여처럼 근로 조건과 제도 기준을 함께 확인해야 할 때 사용합니다.</p>
        </article>
        <article>
          <h2>금융</h2>
          <p>대출 이자는 원금, 금리, 기간, 상환 방식별 부담을 비교할 때 먼저 확인하기 좋습니다.</p>
        </article>
        <article>
          <h2>사업·판매</h2>
          <p>판매자 마진은 판매가와 비용을 넣어 주문 또는 상품 단위의 예상 수익성을 점검할 때 사용합니다.</p>
        </article>
      </div>

      <div className="calculator-grid" role="list">
        <a
          className="calculator-card"
          href="/calculators/loan/"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">금융</span>
            <h2>대출 이자 계산기</h2>
            <p>
              원리금균등·원금균등·만기일시상환의 이자와 월별 일정을
              비교합니다.
            </p>
            <p>
              대표 입력값: 대출금액, 연이율, 기간 · 결과: 월 납입액,
              총이자, 상환 일정
            </p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>

        <a
          className="calculator-card"
          href="/calculators/salary/"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">급여</span>
            <h2>연봉 실수령액 계산기</h2>
            <p>
              2026년 기준 4대보험과 간이세액표를 적용한 예상 실수령액을
              확인합니다.
            </p>
            <p>
              대표 입력값: 연봉, 월 비과세액, 가족 수 · 결과: 월 실수령액,
              공제 항목별 금액
            </p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>

        <a
          className="calculator-card"
          href="/calculators/social-insurance/"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">급여</span>
            <h2>4대보험 계산기</h2>
            <p>
              월 급여와 비과세 금액으로 국민연금, 건강보험, 장기요양보험,
              고용보험 근로자 부담액을 계산합니다.
            </p>
            <p>
              대표 입력값: 월 급여, 비과세 금액 · 결과: 보험별 공제액,
              총 공제액, 공제 후 참고 금액
            </p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>

        <a
          className="calculator-card"
          href="/calculators/seller-margin/"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">사업</span>
            <h2>판매자 마진 계산기</h2>
            <p>판매 비용을 바탕으로 마진과 순이익을 확인하는 계산기입니다.</p>
            <p>
              대표 입력값: 판매가, 수량, 원가, 수수료, 배송비 · 결과:
              정산금액, 순이익, 순이익률
            </p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>

        <a
          className="calculator-card"
          href="/calculators/severance/"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">급여</span>
            <h2>퇴직금 계산기</h2>
            <p>
              입사일과 퇴직 전 임금을 바탕으로 법정 퇴직금 예상액과 대상
              여부를 확인합니다.
            </p>
            <p>
              대표 입력값: 입사일, 퇴직일, 임금총액, 상여금 · 결과:
              평균임금, 예상 퇴직금
            </p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>

        <a
          className="calculator-card"
          href="/calculators/unemployment/"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">급여</span>
            <h2>실업급여 계산기</h2>
            <p>
              월급 또는 1일 평균임금과 고용보험 가입기간으로 예상 구직급여를
              계산합니다.
            </p>
            <p>
              대표 입력값: 임금, 가입기간, 나이 구간, 퇴직 사유 · 결과:
              1일 급여액, 지급일수, 총액
            </p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </section>
  );
}

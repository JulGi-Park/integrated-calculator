import type { Metadata } from "next";

const ogTitle = "계산기 모음 - 연봉·대출·퇴직금·실업급여 계산";
const ogDescription =
  "계산박스에서 제공하는 생활 계산기 목록입니다. 필요한 계산기를 선택해 빠르게 확인해보세요.";
const ogUrl = "https://gyesanbox.kr/calculators/";
const ogImage = "https://gyesanbox.kr/og/calculators.png";

export const metadata: Metadata = {
  title: "계산박스 계산기 목록",
  description:
    "계산박스에서 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 계산기를 확인하세요.",
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
        <p>필요한 계산기를 선택해 시작하세요.</p>
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
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </section>
  );
}

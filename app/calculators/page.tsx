import type { Metadata } from "next";
import { CalculatorCategoryFilter } from "@/components/calculators/CalculatorCategoryFilter";
import { CALCULATOR_REGISTRY } from "@/lib/calculatorRegistry";

const ogTitle = "계산기 모음 - 부가세·연봉·4대보험·대출 계산";
const ogDescription = "계산박스에서 제공하는 생활 계산기 목록입니다. 필요한 계산기를 선택해 빠르게 확인해보세요.";
const ogUrl = "https://gyesanbox.kr/calculators/";
const ogImage = "https://gyesanbox.kr/og/calculators.png";

export const metadata: Metadata = {
  title: "계산박스 계산기 목록",
  description: "계산박스에서 급여·금융·주거·사업·투자·생활 분야의 계산기를 한곳에서 확인하세요. 연봉, 대출, 주거비, 판매 수익, 투자 손익, 생활 비용을 목적에 맞게 계산할 수 있습니다.",
  alternates: { canonical: ogUrl },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: ogUrl,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
  },
  twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, images: [ogImage] },
};

export default function CalculatorsPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-heading__eyebrow">Calculators</p>
        <h1>계산기 목록</h1>
        <p>
          현재 공개 운영 중인 계산기 {CALCULATOR_REGISTRY.length}개를 모았습니다. 각 계산기는 입력값,
          계산 기준, 결과 해석과 주의사항을 함께 제공합니다.
        </p>
      </div>

      <div className="calculator-guide" aria-label="계산기 선택 안내">
        <article><h2>급여</h2><p>연봉 실수령액, 4대보험, 주휴수당, 퇴직금, 실업급여 등 급여·근로·지원 관련 계산을 확인합니다.</p></article>
        <article><h2>금융</h2><p>대출 이자, 예금·적금, 카드 할부, DSR, 청년미래적금 등 금리·상환·저축 조건을 비교합니다.</p></article>
        <article><h2>주거</h2><p>전세 vs 월세와 부동산 중개보수 등 주거비와 거래비용을 살펴봅니다.</p></article>
        <article><h2>사업</h2><p>판매자 마진, 부가세, ROAS 등 판매·세금·광고 수익성을 계산합니다.</p></article>
        <article><h2>투자</h2><p>물타기·평단가처럼 추가 매수 후 평균단가와 손익 기준을 확인합니다.</p></article>
        <article><h2>생활</h2><p>자동차 유지비와 국비지원 자격증 취득비용 등 생활 과정의 비용을 계산합니다.</p></article>
      </div>

      <CalculatorCategoryFilter calculators={CALCULATOR_REGISTRY} />
    </section>
  );
}

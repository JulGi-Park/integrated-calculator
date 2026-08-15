import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { SalaryTakeHomeCalculator } from "@/components/calculators/SalaryTakeHomeCalculator";
import { SalaryTakeHomeContent } from "@/components/calculators/SalaryTakeHomeContent";
import { CompactCalculatorHero } from "@/components/common/CompactCalculatorHero";
import {
  salaryTakeHomeBreadcrumbJsonLd,
  salaryTakeHomeFaqJsonLd,
  salaryTakeHomeWebApplicationJsonLd,
} from "@/components/calculators/salaryTakeHomeContentData";
import { SALARY_TAKE_HOME_POLICY_2026 } from "@/lib/calculators/salary-take-home/policy";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO.salary;
const { title, description } = seo;
const ogTitle = "2026 연봉 실수령액 계산기 | 월급·4대보험·세금 공제 후 예상액";
const ogDescription =
  "연봉을 입력하면 월급으로 환산하고 월 비과세액·가족·자녀 수를 반영해 4대보험과 소득세·지방소득세 공제 후 예상 월·연 실수령액을 확인하세요.";
const ogUrl = `https://gyesanbox.kr${seo.path}`;
const ogImage = seo.image;

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
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

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function SalaryTakeHomePage() {
  const jsonLdItems = [
    { ...salaryTakeHomeWebApplicationJsonLd, image: ogImage },
    salaryTakeHomeBreadcrumbJsonLd,
    salaryTakeHomeFaqJsonLd,
  ];

  return (
    <section className="page-section salary-page">
      <JsonLdScripts items={jsonLdItems} />

      <CompactCalculatorHero
        className="seller-margin-heading"
        eyebrow="Salary take-home"
        title="2026 연봉 실수령액 계산기"
        description={
          <>
          연봉을 월급으로 환산하고 월 비과세액, 공제대상 가족 수·자녀 수를 반영해
          4대보험과 소득세·지방소득세를 뺀 월·연간 예상 실수령액과 공제 내역을 확인합니다.
          계약상 월급과 기준소득월액은 다를 수 있으며 계산 결과는 예상값입니다.
          </>
        }
        meta={
          <>
          <span>
            적용 정책: {SALARY_TAKE_HOME_POLICY_2026.year}년
          </span>
          <span>
            기준 확인일:{" "}
            {formatKoreanDate(SALARY_TAKE_HOME_POLICY_2026.verifiedAt)}
          </span>
          <span>
            퇴직금과 비정기 상여를 제외한 일반 근로자의 예상값입니다.
          </span>
          </>
        }
      />

      <SalaryTakeHomeCalculator />
      <SalaryTakeHomeContent />

      <nav className="link-row seller-margin-links" aria-label="페이지 이동">
        <a className="text-link" href="/calculators/">
          ← 계산기 목록
        </a>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </nav>
    </section>
  );
}

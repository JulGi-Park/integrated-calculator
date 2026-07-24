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
const ogTitle = "연봉 실수령액 계산기 - 세금 공제 후 실제 월급 확인";
const ogDescription =
  "연봉을 입력하면 국민연금, 건강보험, 고용보험, 소득세 등을 반영해 예상 월 실수령액을 확인할 수 있습니다.";
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
        title="연봉 실수령액 계산기"
        description={
          <>
          연봉과 비과세액, 공제대상 가족 수를 입력해 월·연간 예상
          실수령액과 공제 내역을 확인할 수 있습니다.
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

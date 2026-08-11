import type { Metadata } from "next";
import Link from "next/link";
import { OvertimePayCalculator } from "@/components/calculators/OvertimePayCalculator";
import {
  OvertimePayContent,
  overtimePayBreadcrumbJsonLd,
  overtimePayFaqJsonLd,
  overtimePayWebApplicationJsonLd,
} from "@/components/calculators/OvertimePayContent";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";

const title = "야간수당 계산기 2026 - 연장근로·휴일근로수당 자동 계산";
const description =
  "시급과 연장근로, 야간근로, 휴일근로 시간을 입력해 연장근로수당·야간근로 가산수당·휴일근로수당을 나눠 계산합니다.";
const ogUrl = "https://gyesanbox.kr/calculators/overtime-pay/";
const ogImage = "https://gyesanbox.kr/og/overtime-pay.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title,
    description,
    url: ogUrl,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function OvertimePayPage() {
  return (
    <section className="page-section">
      <JsonLdScripts
        items={[
          overtimePayWebApplicationJsonLd,
          overtimePayBreadcrumbJsonLd,
          overtimePayFaqJsonLd,
        ]}
      />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Overtime pay</p>
        <h1>연장·야간·휴일근로수당 계산기</h1>
        <p>
          야근을 했는데 월급에 얼마가 더 붙어야 하는지 헷갈릴 때, 시급과
          근무 시간을 입력해 연장·야간·휴일근로수당을 나눠 확인할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>기준일: 2026년 8월 9일</span>
          <span>근로기준법 제56조 참고 계산</span>
        </div>
      </div>

      <OvertimePayCalculator />
      <OvertimePayContent />

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

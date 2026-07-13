import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { NationalPensionGuideContent } from "@/components/guides/NationalPensionGuideContent";
import {
  nationalPensionGuideArticleJsonLd,
  nationalPensionGuideBreadcrumbJsonLd,
  nationalPensionGuideFaqJsonLd,
} from "@/components/guides/nationalPensionGuideData";

const canonical = "https://gyesanbox.kr/guides/national-pension-july-2026/";
const title = "2026년 7월 국민연금 공제액이 달라진 이유 | 계산박스 가이드";
const description =
  "2026년 국민연금 보험료율과 7월 기준소득월액 상한 변경을 구분하고, 급여명세서에서 공제액 변화 원인을 확인하는 방법을 안내합니다.";
const ogImage = "https://gyesanbox.kr/og/policy.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "article",
    publishedTime: "2026-07-13T00:00:00+09:00",
    modifiedTime: "2026-07-13T00:00:00+09:00",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImage] },
};

export default function NationalPensionJulyGuidePage() {
  return (
    <section className="page-section">
      <JsonLdScripts
        items={[
          nationalPensionGuideArticleJsonLd,
          nationalPensionGuideBreadcrumbJsonLd,
          nationalPensionGuideFaqJsonLd,
        ]}
      />
      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">National pension guide</p>
        <h1>2026년 7월 국민연금 공제액이 달라진 이유</h1>
        <p>
          월급이 그대로여도 국민연금 공제액이 달라질 수 있습니다. 보험료율,
          7월 상한 변경, 신고 기준소득월액과 정산 항목을 구분해 확인하세요.
        </p>
        <div className="seller-margin-meta">
          <span>확인일: 2026년 7월 13일</span>
          <span>직장가입자 급여명세서 확인을 위한 안내</span>
          <span>사업장 신고와 국민연금공단 결정이 실제 공제에 우선합니다.</span>
        </div>
      </div>

      <NationalPensionGuideContent />

      <nav className="link-row seller-margin-links" aria-label="가이드 페이지 이동">
        <Link className="text-link" href="/guides/">← 가이드 목록</Link>
        <Link className="text-link" href="/methodology/">계산 방법론</Link>
        <Link className="text-link" href="/">홈으로</Link>
      </nav>
    </section>
  );
}

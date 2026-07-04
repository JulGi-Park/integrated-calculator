import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

export const metadata: Metadata = {
  title: "계산박스 소개 | 계산박스",
  description:
    "계산박스는 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 등 생활·금융·근로 계산기를 제공하는 온라인 계산기 모음입니다.",
  alternates: {
    canonical: "https://gyesanbox.kr/about/",
  },
};

export default function AboutPage() {
  return (
    <PolicyPageLayout
      eyebrow="About"
      title="계산박스 소개"
      description="계산박스는 대한민국 사용자를 위한 생활·금융·근로 계산기 모음 서비스입니다."
    >
      <section>
        <h2>서비스 목적</h2>
        <p>
          계산박스는 일상과 업무에서 자주 확인하는 계산을 한곳에서 빠르게
          살펴볼 수 있도록 만든 온라인 계산기 모음입니다.
        </p>
      </section>

      <section>
        <h2>현재 제공 중인 계산기</h2>
        <ul>
          <li>판매자 마진 계산기</li>
          <li>연봉 실수령액 계산기</li>
          <li>대출 이자 계산기</li>
          <li>퇴직금 계산기</li>
          <li>실업급여 계산기</li>
        </ul>
      </section>

      <section>
        <h2>이용 전 안내</h2>
        <p>
          계산 결과는 참고용이며 실제 세금, 보험료, 급여, 대출 조건,
          퇴직금과 실업급여 판단은 개인 상황과 기관 기준에 따라 달라질 수
          있습니다. 중요한 의사결정 전에는 관련 기관 또는 전문가의 확인이
          필요합니다.
        </p>
      </section>

      <section>
        <h2>운영 연락처</h2>
        <p>
          서비스 관련 문의는{" "}
          <a href="mailto:contact@gyesanbox.kr">contact@gyesanbox.kr</a> 로
          보내 주세요. 자세한 문의 항목은{" "}
          <a href="/contact/">문의 페이지</a>에서 확인할 수 있습니다.
        </p>
      </section>
    </PolicyPageLayout>
  );
}

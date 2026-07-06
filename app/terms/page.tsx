import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const ogTitle = "이용약관 - 계산박스";
const ogDescription = "계산박스 서비스 이용약관 안내 페이지입니다.";
const ogUrl = "https://gyesanbox.kr/terms/";
const ogImage = "https://gyesanbox.kr/og/policy.png";

export const metadata: Metadata = {
  title: "이용약관 | 계산박스",
  description:
    "계산박스 서비스 이용 조건, 계산 결과 이용 범위, 콘텐츠 이용 제한 및 문의 방법을 안내합니다.",
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

export default function TermsPage() {
  return (
    <PolicyPageLayout
      eyebrow="Terms"
      title="이용약관"
      description="계산박스 서비스를 이용할 때 참고할 기본 조건을 안내합니다."
    >
      <section>
        <h2>서비스 이용</h2>
        <p>
          계산박스는 생활·금융·근로 계산기를 제공하는 온라인 서비스입니다.
          사용자는 본 약관과 각 페이지의 안내를 참고해 서비스를 이용할 수
          있습니다.
        </p>
      </section>

      <section>
        <h2>계산 결과의 이용 범위</h2>
        <p>
          계산 결과는 입력값과 표시된 기준에 따른 참고용 결과이며 실제 결과와
          다를 수 있습니다. 사용자는 계산 결과를 참고자료로만 활용해야 하며,
          공식 판단이 필요한 경우 관련 기관 또는 전문가의 확인이 필요합니다.
        </p>
      </section>

      <section>
        <h2>금지 행위</h2>
        <p>
          서비스의 안정적인 운영을 방해하는 부정 사용, 자동화된 과도한 요청,
          비정상적인 접근 시도는 금지됩니다.
        </p>
      </section>

      <section>
        <h2>저작권과 콘텐츠 이용 제한</h2>
        <p>
          계산박스에 게시된 텍스트, 계산기 구성, 화면 구성, 설명 콘텐츠,
          자체 제작 자료의 저작권은 계산박스 또는 정당한 권리자에게 있습니다.
          사용자는 계산박스의 콘텐츠를 개인적인 참고 목적으로 이용할 수
          있습니다.
        </p>
        <p>
          사전 허락 없이 콘텐츠를 무단 복제, 배포, 전재, 재가공, 크롤링하거나
          상업적으로 이용해서는 안 됩니다. 공식 기관의 기준, 법령, 제도 설명
          등 외부 자료를 참고하는 경우 각 계산기 페이지에 출처와 기준일을
          표시합니다.
        </p>
        <p>
          저작권 침해 또는 권리 침해 신고는{" "}
          <a href="mailto:contact@gyesanbox.kr">contact@gyesanbox.kr</a> 로
          접수해 주세요.
        </p>
      </section>

      <section>
        <h2>서비스 변경과 문의</h2>
        <p>
          계산박스는 사전 고지 없이 서비스의 일부를 변경하거나 중단할 수
          있습니다. 이용 관련 문의는{" "}
          <a href="mailto:contact@gyesanbox.kr">contact@gyesanbox.kr</a> 로
          보내 주세요.
        </p>
        <p>시행일: 2026년 6월 25일</p>
      </section>
    </PolicyPageLayout>
  );
}

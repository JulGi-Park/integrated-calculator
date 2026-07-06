import type { Metadata } from "next";
import { ContactEmail } from "@/components/common/ContactEmail";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const ogTitle = "면책사항 - 계산박스";
const ogDescription =
  "계산박스의 계산 결과와 정보 제공 범위에 대한 면책 안내 페이지입니다.";
const ogUrl = "https://gyesanbox.kr/disclaimer/";
const ogImage = "https://gyesanbox.kr/og/policy.png";

export const metadata: Metadata = {
  title: "면책문구 | 계산박스",
  description:
    "계산박스 계산 결과의 참고용 성격, 실제 적용 기준 차이, 공식 기관 확인 필요성을 안내합니다.",
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

export default function DisclaimerPage() {
  return (
    <PolicyPageLayout
      eyebrow="Disclaimer"
      title="면책문구"
      description="계산박스 계산 결과의 참고용 성격과 실제 적용 기준 차이를 안내합니다."
    >
      <section>
        <h2>계산 결과의 성격</h2>
        <p>
          계산박스의 모든 계산 결과는 참고용입니다. 세금, 보험료, 급여,
          퇴직금, 실업급여, 대출 조건 등은 개인 상황, 법령, 기관 기준,
          금융기관 조건에 따라 달라질 수 있습니다.
        </p>
      </section>

      <section>
        <h2>확인이 필요한 경우</h2>
        <p>
          공식 판단이나 금전적 의사결정이 필요한 경우에는 관련 기관,
          금융기관, 세무사, 노무사 등 전문가에게 확인하는 것이 좋습니다.
          계산식과 기준일은 각 계산기 페이지에서 확인할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>책임 범위</h2>
        <p>
          계산박스는 계산 결과의 정확성을 높이기 위해 노력하지만, 입력값 오류,
          기준 변경, 개인별 예외 조건 등으로 인해 실제 결과와 차이가 생길 수
          있습니다. 계산 결과 사용으로 발생한 손해에 대해 법적 책임을 보장하지 않습니다.
        </p>
      </section>

      <section>
        <h2>문의</h2>
        <p>
          기준 오류나 계산 이상이 의심되는 경우{" "}
          <a href="/contact/">
            <ContactEmail />
          </a>
          로
          알려 주세요.
        </p>
        <p>
          계산박스는 공식 기준과 출처를 확인해 콘텐츠를 작성하려고 노력합니다.
          저작권 또는 권리 침해 소지가 있는 내용이 있다면{" "}
          <a href="/contact/">
            <ContactEmail />
          </a>
          로
          알려 주시면 확인 후 조치하겠습니다.
        </p>
        <p>시행일: 2026년 6월 25일</p>
      </section>
    </PolicyPageLayout>
  );
}

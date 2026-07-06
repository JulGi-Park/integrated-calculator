import type { Metadata } from "next";
import { ContactEmail } from "@/components/common/ContactEmail";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const ogTitle = "개인정보처리방침 - 계산박스";
const ogDescription = "계산박스의 개인정보처리방침 안내 페이지입니다.";
const ogUrl = "https://gyesanbox.kr/privacy-policy/";
const ogImage = "https://gyesanbox.kr/og/policy.png";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 계산박스",
  description:
    "계산박스의 개인정보 처리, 쿠키, 광고, 분석 도구 사용 가능성 및 문의 방법을 안내합니다.",
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

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Privacy"
      title="개인정보처리방침"
      description="계산박스의 개인정보 처리 기준과 쿠키, 광고, 분석 도구 사용 가능성을 안내합니다."
    >
      <section>
        <h2>기본 처리 원칙</h2>
        <p>
          계산박스는 초기 MVP에서 로그인, 회원가입, 결제, 운영 DB 저장 기능을
          사용하지 않습니다. 사용자가 입력한 계산값은 계산 결과 제공을 위해
          브라우저에서 처리되며 서버에 저장하지 않습니다.
        </p>
      </section>

      <section>
        <h2>브라우저 로컬 저장</h2>
        <p>
          일부 계산기는 사용 편의를 위해 입력값을 사용자의 브라우저
          localStorage에 저장할 수 있습니다. 이 정보는 사용자의 기기에
          저장되며, 브라우저 설정이나 초기화 기능을 통해 삭제할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>쿠키와 제3자 서비스</h2>
        <p>
          계산박스는 서비스 운영, 검색 노출 확인, 방문 통계와 광고 제공을 위해
          Google AdSense, Google Analytics 4, Google Search Console 같은 제3자
          서비스를 사용할 수 있습니다. 이 과정에서 쿠키, 로그, 광고 식별자,
          접속 정보, IP 주소, 브라우저 정보 등이 서비스 제공자에 의해 처리될
          수 있습니다.
        </p>
        <p>
          Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 사용자의 이전 방문
          정보에 기반한 광고를 제공할 수 있습니다. Google의 광고 쿠키는
          사용자가 계산박스 또는 다른 사이트를 방문한 이력을 바탕으로 광고를
          제공하는 데 사용될 수 있습니다.
        </p>
        <p>
          사용자는 Google 광고 설정에서 개인 맞춤 광고를 관리하거나 선택
          해제할 수 있으며, 브라우저 설정에서 쿠키 저장을 제한하거나 삭제할 수
          있습니다. 제3자는 광고 제공 결과를 측정하거나 광고 품질을 관리하기
          위해 쿠키, 웹 비콘, IP 주소와 유사한 기술 정보를 사용할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>제3자 광고 및 쿠키</h2>
        <p>
          계산박스는 Google AdSense 등 제3자 광고 서비스를 사용할 수 있습니다.
          광고 서비스가 적용될 경우 제3자 광고 사업자는 쿠키 또는 유사 기술을
          사용하여 사용자의 방문 정보, 브라우저 정보, 광고 식별자 등을 처리할
          수 있습니다.
        </p>
        <p>
          사용자는 브라우저 설정에서 쿠키 저장을 제한하거나 삭제할 수 있으며,
          Google 광고 설정을 통해 맞춤 광고 관련 설정을 관리할 수 있습니다.
        </p>
        <p>
          광고 적용 여부와 무관하게 계산박스의 계산 결과는 참고용이며, 개인별
          상황, 법령, 기관 기준, 금융기관 조건 등에 따라 실제 결과는 달라질 수
          있습니다.
        </p>
      </section>

      <section>
        <h2>정책 변경과 문의</h2>
        <p>
          서비스 기능이나 사용하는 외부 도구가 변경되면 개인정보처리방침도
          수정될 수 있습니다. 개인정보 관련 문의는{" "}
          <a href="/contact/">
            <ContactEmail />
          </a>
          로
          보내 주세요.
        </p>
        <p>시행일: 2026년 6월 25일</p>
      </section>
    </PolicyPageLayout>
  );
}

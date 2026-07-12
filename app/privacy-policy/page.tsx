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
          계산박스는 로그인, 회원가입, 결제, 운영 DB 저장 기능을 사용하지
          않습니다. 사용자가 입력한 계산값은 계산 결과 제공을 위해 브라우저에서
          처리되며 서버에 저장하지 않습니다.
        </p>
        <p>
          계산기 입력값은 급여, 대출, 퇴직, 실업급여와 관련된 민감한 생활
          정보일 수 있으므로, 계산박스는 서비스 제공에 필요하지 않은 회원
          식별 기능을 두지 않습니다. 공유나 복사 기능을 사용하는 경우에도
          사용자가 직접 실행한 동작에 한해 브라우저 기능을 이용합니다.
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
        <h2>분석·광고와 쿠키</h2>
        <p>
          계산박스는 사이트 이용 현황을 파악하고 서비스를 개선하기 위해 Google Analytics 4를 사용합니다. Google AdSense는 페이지에 광고를 제공하고
          광고 성과를 측정하기 위해 사용합니다. 이 과정에서 각 서비스 제공자가
          쿠키 또는 유사 기술, 로그, 광고 식별자, 접속 정보, IP 주소와 브라우저
          정보를 처리할 수 있습니다.
        </p>
        <p>
          제3자 광고 사업자는 이전 방문 정보에 기반한 광고를 제공할 수 있지만,
          AdSense 스크립트가 있다는 이유만으로 개인 맞춤 광고가 항상 표시되는
          것은 아닙니다. 사용자는 브라우저 설정에서 쿠키 저장을 제한하거나
          삭제할 수 있고, Google 광고 설정에서 맞춤 광고 관련 선택을 관리할 수
          있습니다.
        </p>
        <p>
          광고 적용 여부와 무관하게 계산박스의 계산 결과는 참고용이며, 개인별
          상황, 법령, 기관 기준, 금융기관 조건 등에 따라 실제 결과는 달라질 수
          있습니다.
        </p>
      </section>

      <section>
        <h2>문의 데이터 처리</h2>
        <p>
          사용자가 문의를 보내는 경우 이메일 주소, 문의 내용, 오류 재현에
          필요한 입력 조건과 첨부 정보가 확인 과정에서 처리될 수 있습니다.
          문의 내용은 답변, 오류 확인, 기준 정정 검토 목적으로만 사용하며,
          사용자가 삭제를 요청하거나 보관 필요성이 사라지면 합리적인 범위에서
          정리합니다.
        </p>
        <p>
          문의 시 주민등록번호, 계좌번호, 카드번호, 비밀번호, 급여명세서 원본
          등 불필요한 개인정보를 보내지 말아 주세요. 계산 오류 확인에는
          계산기 이름, 입력값 범위, 화면 결과와 기준 출처만으로 충분한 경우가
          많습니다.
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

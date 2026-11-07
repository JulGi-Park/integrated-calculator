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
          계산기 입력값은 결과를 보여주기 위해 브라우저에서 처리하며 계산박스
          서버에는 저장하지 않습니다. 지식센터에 직접 등록한 질문은 게시와
          답변 제공을 위해 서버의 데이터베이스에 저장합니다.
        </p>
        <p>
          계산기 입력값은 급여, 대출, 퇴직, 실업급여와 관련된 민감한 생활
          정보일 수 있으므로, 계산박스는 서비스 제공에 필요하지 않은 회원
          식별 기능을 두지 않습니다. 공유나 복사 기능을 사용하는 경우에도
          사용자가 직접 실행한 동작에 한해 브라우저 기능을 이용합니다.
        </p>
      </section>

      <section>
        <h2>지식센터 질문 처리</h2>
        <p>
          질문을 등록하면 제목, 내용, 카테고리, 선택한 관련 계산기와 익명 여부를
          저장합니다. 익명 등록을 선택하지 않으면 닉네임도 저장합니다. 공개된
          질문과 공식답변은 누구나 열람할 수 있으며, 익명 등록이 아닌 경우에는
          닉네임도 표시됩니다. 질문에 주민등록번호, 계좌번호, 연락처 같은
          개인정보를 적지 마세요.
        </p>
        <p>
          수정·삭제용 비밀번호는 해시로 저장합니다. 중복 제출과 스팸 방지에는
          접속 IP와 질문 내용에서 만든 해시값을 사용하며, 질문 등록과 변경
          요청을 확인하기 위해 Cloudflare Turnstile을 사용합니다. 공식답변이 달리기
          전에는 비밀번호를 확인해 질문을 수정하거나 삭제할 수 있습니다.
          공식답변이 달린 뒤 정정·삭제를 요청하려면 문의 페이지를 이용해 주세요.
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
          Google과 제3자 광고 사업자는 광고 쿠키를 사용해 계산박스나 다른
          웹사이트의 방문 기록에 기반한 광고를 표시할 수 있습니다. 사용자는{" "}
          <a href="https://myadcenter.google.com/">Google 내 광고 센터</a>에서
          맞춤 광고를 끌 수 있으며, 브라우저 설정에서 쿠키 저장을 제한하거나
          기존 쿠키를 삭제할 수 있습니다.
        </p>
        <p>
          광고 제공과 성과 측정에 쓰이는 쿠키, 웹 비콘, IP 주소 등의 처리 방식은{" "}
          <a href="https://policies.google.com/technologies/partner-sites?hl=ko">
            Google의 파트너 사이트 데이터 사용 안내
          </a>
          에서 확인할 수 있습니다.
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

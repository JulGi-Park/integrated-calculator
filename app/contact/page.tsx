import type { Metadata } from "next";
import { ContactEmail } from "@/components/common/ContactEmail";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const ogTitle = "문의하기 - 계산박스";
const ogDescription =
  "계산박스 서비스 관련 문의와 제안은 문의 페이지에서 확인할 수 있습니다.";
const ogUrl = "https://gyesanbox.kr/contact/";
const ogImage = "https://gyesanbox.kr/og/contact.png";

export const metadata: Metadata = {
  title: "문의 | 계산박스",
  description:
    "계산박스 이용 중 계산 오류, 기준 정보, 사이트 이용 관련 문의 방법을 안내합니다.",
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

export default function ContactPage() {
  return (
    <PolicyPageLayout
      eyebrow="Contact"
      title="문의"
      description="계산박스 이용 중 확인이 필요한 내용은 이메일로 보내 주세요."
    >
      <section>
        <h2>공식 문의 이메일</h2>
        <p>
          <ContactEmail />
        </p>
      </section>

      <section>
        <h2>문의 가능 항목</h2>
        <ul>
          <li>계산 오류 제보</li>
          <li>기준일 또는 공식 출처 오류 제보</li>
          <li>출처 오류 또는 인용 정보 수정 요청</li>
          <li>저작권 침해 또는 권리 침해 신고</li>
          <li>사이트 이용 관련 문의</li>
          <li>광고·제휴 관련 문의</li>
        </ul>
      </section>

      <section>
        <h2>계산 오류 제보</h2>
        <p>
          계산 결과는 입력값과 페이지에 표시된 기준을 바탕으로 한 참고용
          결과입니다. 오류가 의심될 때는 사용한 계산기 이름, 입력한 값,
          화면에 표시된 결과, 예상한 결과, 확인한 날짜를 함께 적어 주세요.
        </p>
        <p>
          브라우저 또는 기기 종류, 오류 화면, 재현 순서를 함께 보내 주면
          화면 표시 문제와 계산식 문제를 구분해 확인하는 데 도움이 됩니다.
        </p>
      </section>

      <section>
        <h2>공식 기준 또는 기준일 오류 제보</h2>
        <p>
          공식 기준 변경을 알려 주는 경우에는 관련 계산기, 잘못되었다고
          판단한 기준, 공식 출처 주소 또는 자료명, 자료의 발표일이나 시행일을
          함께 적어 주세요.
        </p>
      </section>

      <section>
        <h2>답변 범위</h2>
        <p>
          계산박스는 페이지 오류, 계산식 검토, 출처 수정, 이용 불편 사항을
          확인합니다. 다만 개인별 세무 상담, 노무 분쟁 판단, 금융상품 추천,
          실업급여 수급자격 확정 같은 개별 판단은 제공하지 않습니다.
        </p>
      </section>

      <section>
        <h2>개인정보 입력 주의</h2>
        <p>
          문의에는 주민등록번호, 계좌번호, 카드번호, 비밀번호, 급여명세서
          원본과 같은 민감한 정보를 포함하지 말아 주세요. 오류 재현에 필요한
          경우에도 개인을 식별할 수 있는 항목은 가린 뒤 계산 조건만 전달하는
          것을 권장합니다.
        </p>
      </section>
    </PolicyPageLayout>
  );
}

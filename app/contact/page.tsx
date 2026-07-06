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
        <h2>문의 전 참고</h2>
        <p>
          계산 결과는 입력값과 페이지에 표시된 기준을 바탕으로 한 참고용
          결과입니다. 문의 시 사용한 계산기 이름과 입력 조건을 함께 적어 주면
          내용을 확인하는 데 도움이 됩니다.
        </p>
      </section>
    </PolicyPageLayout>
  );
}

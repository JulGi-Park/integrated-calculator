import type { Metadata } from "next";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

export const metadata: Metadata = {
  title: "문의 | 계산박스",
  description:
    "계산박스 이용 중 계산 오류, 기준 정보, 사이트 이용 관련 문의는 contact@gyesanbox.kr 로 연락해 주세요.",
  alternates: {
    canonical: "https://gyesanbox.kr/contact/",
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
          <a href="mailto:contact@gyesanbox.kr">contact@gyesanbox.kr</a>
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

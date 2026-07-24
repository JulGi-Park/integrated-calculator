import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const canonical = "https://gyesanbox.kr/methodology/";
const title = "계산 방법론 | 계산박스";
const description =
  "계산박스가 공식 기준을 확인하고 계산식을 구현·검수하며 변경과 오류를 반영하는 방법을 안내합니다.";
const ogImage = "https://gyesanbox.kr/og/policy.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

const jsonLdItems = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "계산박스", item: "https://gyesanbox.kr/" },
      { "@type": "ListItem", position: 2, name: "계산 방법론", item: canonical },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonical,
    description,
    isPartOf: { "@type": "WebSite", name: "계산박스", url: "https://gyesanbox.kr/" },
  },
];

export default function MethodologyPage() {
  return (
    <>
      <JsonLdScripts items={jsonLdItems} />
      <PolicyPageLayout
        eyebrow="Methodology"
        title="계산 방법론"
        description="계산박스가 계산 기준을 조사하고 결과를 검수·갱신하는 방법을 공개합니다."
      >
        <section>
          <h2>계산박스의 목적</h2>
          <p>
            계산박스는 생활·금융·근로·사업과 관련된 숫자를 입력해 예상 결과와
            그 전제를 함께 살펴보도록 돕습니다. 결과를 확정해 주는 기관 서비스가
            아니라, 공개된 기준을 읽고 비교하기 위한 브라우저 중심 도구입니다.
          </p>
        </section>

        <section>
          <h2>공식 출처 우선순위</h2>
          <p>
            법령과 시행령·고시를 먼저 확인하고, 그 다음 해당 제도를 집행하는
            공공기관의 안내를 대조합니다. 금융 계산에서는 금융기관이나 한국은행
            등 공식 금융자료를 우선 확인하며, 요약 자료는 원문을 찾기 위한
            보조 자료로만 사용합니다.
          </p>
          <p>
            계산 기준일은 자료를 확인한 날짜이고 적용일은 그 기준이 실제로
            적용되는 기간의 시작 또는 종료일입니다. 두 날짜가 다를 수 있으므로
            계산기에는 확인일과 적용 범위를 구분해 표시합니다.
          </p>
        </section>

        <section>
          <h2>계산식과 숫자 처리</h2>
          <p>
            화면 설명과 계산식에 같은 기준값을 적용하도록 기준값을 한곳에서
            관리하고, 입력값의 단위와 계산 순서를 명시합니다. 법령이나 공식
            안내에 상한·하한이 있으면 해당 범위를 적용하고, 소수점 처리 규칙은
            원문 또는 계산기 페이지의 설명에 맞춰 반올림·절사합니다. 중간 계산의
            처리 순서가 결과에 영향을 주는 경우에도 같은 순서를 유지합니다.
          </p>
          <p>
            원 단위 처리는 계산기마다 정한 순서를 따릅니다. 예를 들어 부가세
            계산기는 합계금액 10,000원을 역산할 때 공급가액을 원 단위로 반올림한
            9,091원, 매출세액을 나머지 909원으로 계산해 두 금액의 합이 입력값과
            일치하는지 테스트합니다. 대출 계산기는 회차 이자가 정확히 0.5원이면
            올리고 0.5원 미만이면 내리는 경계와 마지막 회차 잔액 보정을 별도로
            확인합니다.
          </p>
        </section>

        <section>
          <h2>대표 사례와 경계값 테스트</h2>
          <p>
            대표 입력은 계산식 설명과 결과가 함께 맞는지 확인하는 데 사용합니다.
            연봉 실수령액 계산기는 국민연금 기준소득월액 하한 41만원과 상한
            659만원에 대해 하한 미만·하한값·하한 직상, 상한값·상한 초과 입력을
            나눠 검사합니다. 상한을 넘는 입력에서는 근로자 국민연금 공제액이
            313,020원으로 유지되는지도 확인합니다.
          </p>
          <p>
            주휴수당 계산기는 주 소정근로시간 14시간과 15시간을 나란히 검사해
            지급 대상 경계를 확인하고, 주 50시간 입력에서도 주휴시간이 8시간을
            넘지 않는지 테스트합니다. 최소값·최대값은 허용되는 경계 자체와 바로
            바깥 값을 함께 넣어 정상 결과와 오류가 뒤바뀌지 않도록 확인합니다.
          </p>
        </section>

        <section>
          <h2>잘못된 입력 방어</h2>
          <p>
            빈 값, 음수, 허용 범위를 넘는 값과 숫자가 아닌 입력은 필드별 오류로
            처리합니다. 계산 함수에는 화면을 우회해 들어올 수 있는 NaN,
            Infinity, -Infinity도 넣어 유한한 숫자가 아니면 결과를 만들지 않는지
            검사합니다. 대출 계산에서는 600개월 같은 최대 허용값과 그 초과값을
            각각 테스트하며, 날짜를 쓰는 계산기는 입사일·퇴직일처럼 앞뒤 순서가
            잘못된 입력도 거부합니다.
          </p>
        </section>

        <section>
          <h2>자동 반영하지 않는 예외</h2>
          <p>
            회사별 임금 항목, 개인의 가입·수급 이력, 신청 서류와 기관의 심사처럼
            개인별 예외는 공개된 입력만으로 자동 확정할 수 없습니다. 이런 조건은
            계산기에서 제외하거나 별도 안내로 남기며, 실제 적용 여부는 관련
            기관과 고용주·금융기관의 자료를 확인해야 합니다.
          </p>
        </section>

        <section>
          <h2>변경과 오류 수정</h2>
          <p>
            정책 변경이 확인되면 공식 원문과 시행 시점을 다시 대조하고, 정책값·
            계산 설명·대표 사례와 경계값 테스트를 함께 갱신합니다. 확인 가능한
            공개 변경은 <Link href="/updates/">변경 이력</Link>에 대상과 이유를
            기록합니다.
          </p>
          <p>
            오류 제보에는 계산기 이름, 입력 조건, 화면 결과, 참고한 공식 자료와
            확인일을 적어 주세요. 재현 가능한 입력을 먼저 확인하고 원인에 따라
            계산식, 기준 표시 또는 설명을 수정합니다. 주민등록번호나 계좌번호 등
            민감정보는 보내지 않아도 됩니다.
          </p>
          <p>
            수정할 때는 재현 입력을 테스트에 남기고 관련 정책값과 화면 설명을
            함께 확인합니다. 예를 들어 국민연금 상·하한을 갱신한 경우에는 새
            적용 기간, 경계 입력 결과와 계산기 안내가 같은 값을 쓰는지 다시
            검수합니다.
          </p>
        </section>

        <section>
          <h2>브라우저 계산과 참고용 결과</h2>
          <p>
            입력값은 결과를 계산하고 화면에 표시하는 데 필요한 범위에서 브라우저
            중심으로 처리합니다. 결과는 입력값과 공개된 기준에 따른 예상값이며,
            개인별 사실관계·기관의 최신 판단·신고 자료를 대신하지 않습니다.
            계산박스는 개인별 세무·노무·금융 상담을 제공하지 않으므로, 신고·수급
            자격·대출 계약처럼 개별 판단이 필요한 경우에는 관련 기관 또는 해당
            분야 전문가에게 자신의 자료를 바탕으로 확인해야 합니다.
          </p>
        </section>
      </PolicyPageLayout>
    </>
  );
}

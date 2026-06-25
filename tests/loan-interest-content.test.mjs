import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/loan/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import {
  loanInterestBreadcrumbJsonLd,
  loanInterestCalculationCriteria,
  loanInterestExampleInput,
  loanInterestExampleInputItems,
  loanInterestExampleResultItems,
  loanInterestExclusions,
  loanInterestFaqJsonLd,
  loanInterestFaqs,
  loanInterestQuickComparison,
  loanInterestSources,
  loanInterestWebApplicationJsonLd,
} from "../components/calculators/loanInterestContentData.ts";
import { calculateLoanRepaymentComparison } from "../lib/calculators/loan/loan-repayment.ts";

const pageSource = await readFile("app/calculators/loan/page.tsx", "utf8");
const contentSource = await readFile(
  "components/calculators/LoanInterestContent.tsx",
  "utf8",
);
const dataSource = await readFile(
  "components/calculators/loanInterestContentData.ts",
  "utf8",
);

test("대출 계산기 전용 SEO 메타데이터를 URL 하드코딩 없이 설정한다", () => {
  const expectedTitle =
    "대출 이자 계산기 | 원리금균등·원금균등·만기일시상환 비교";
  const expectedDescription =
    "대출금액과 연이율, 기간을 입력해 월 납입액과 총이자를 계산하고 원리금균등·원금균등·만기일시상환 결과와 월별 일정을 비교해 보세요.";

  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(metadata.openGraph.title, expectedTitle);
  assert.equal(metadata.openGraph.description, expectedDescription);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.twitter.card, "summary");
  assert.equal(metadata.twitter.title, expectedTitle);
  assert.equal(metadata.twitter.description, expectedDescription);
  assert.equal(metadata.alternates, undefined);
  assert.equal(metadata.openGraph.url, undefined);

  const metadataText = JSON.stringify(metadata);
  assert.doesNotMatch(
    metadataText,
    /canonical|localhost|127\.0\.0\.1|pages\.dev|example\.com/,
  );
});

test("대출 페이지 상단은 H1 하나와 고정 안내를 유지한다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /<h1>대출 이자 계산기<\/h1>/);
  assert.match(pageSource, /원 단위 예상 계산/);
  assert.match(pageSource, /실제 대출 가능\s+범위를 뜻하지 않습니다/);
});

test("상환방식 빠른 비교를 세 카드로 정적으로 표시한다", () => {
  assert.equal(loanInterestQuickComparison.length, 3);
  assert.match(contentSource, /loanInterestQuickComparison\.map/);
  assert.deepEqual(
    loanInterestQuickComparison.map((item) => item.title),
    ["원리금균등상환", "원금균등상환", "만기일시상환"],
  );
});

test("계산 기준·반올림·마지막 회차 보정을 설명한다", () => {
  assert.equal(loanInterestCalculationCriteria.common.length, 5);
  assert.match(
    contentSource,
    /현재 계산기는 월 이율, 원 단위 half-up 반올림, 마지막 회차 잔액\s+보정 정책/,
  );
  assert.match(dataSource, /half-up 반올림/);
  assert.match(dataSource, /마지막 회차 원금은 남은 잔액 전액으로 보정/);
  assert.match(dataSource, /0% 금리도 별도 처리/);
  assert.match(dataSource, /1개월 대출도/);
});

test("고정 예시 입력과 결과는 엔진 확정값과 일치한다", () => {
  assert.deepEqual(loanInterestExampleInput, {
    principal: 100_000_000,
    annualInterestRate: 4,
    termMonths: 120,
  });
  assert.deepEqual(loanInterestExampleInputItems, [
    { label: "대출원금", value: "100,000,000원" },
    { label: "연이율", value: "4%" },
    { label: "기간", value: "120개월" },
  ]);

  assert.deepEqual(loanInterestExampleResultItems, [
    {
      title: "원리금균등상환",
      items: [
        { label: "첫 달 납입액", value: "1,012,451원" },
        { label: "마지막 달 납입액", value: "1,012,507원" },
        { label: "총이자", value: "21,494,176원" },
        { label: "총상환액", value: "121,494,176원" },
        { label: "월 납입액 특징", value: "대체로 일정" },
      ],
    },
    {
      title: "원금균등상환",
      items: [
        { label: "첫 달 납입액", value: "1,166,666원" },
        { label: "마지막 달 납입액", value: "836,151원" },
        { label: "총이자", value: "20,166,675원" },
        { label: "총상환액", value: "120,166,675원" },
        { label: "월 납입액 특징", value: "점차 감소" },
      ],
    },
    {
      title: "만기일시상환",
      items: [
        { label: "첫 달 납입액", value: "333,333원" },
        { label: "마지막 달 납입액", value: "100,333,333원" },
        { label: "총이자", value: "39,999,960원" },
        { label: "총상환액", value: "139,999,960원" },
        { label: "월 납입액 특징", value: "이자만 내다가 만기 상환" },
      ],
    },
  ]);

  const response = calculateLoanRepaymentComparison(loanInterestExampleInput);

  assert.equal(response.success, true);
  if (!response.success) {
    throw new Error("고정 예시 계산이 실패했습니다.");
  }

  assert.equal(response.data.equalPayment.repaymentType, "equalPayment");
  assert.equal(response.data.equalPayment.principal, 100_000_000);
  assert.equal(response.data.equalPayment.totalInterest, 21_494_176);
  assert.equal(response.data.equalPayment.totalPayment, 121_494_176);
  assert.equal(response.data.equalPayment.termMonths, 120);
  assert.equal(response.data.equalPayment.regularMonthlyPayment, 1_012_451);
  assert.equal(response.data.equalPayment.firstMonthPrincipal, 679_118);
  assert.equal(response.data.equalPayment.firstMonthInterest, 333_333);
  assert.equal(response.data.equalPayment.lastMonthPrincipal, 1_009_143);
  assert.equal(response.data.equalPayment.lastMonthInterest, 3_364);
  assert.equal(response.data.equalPayment.lastMonthPayment, 1_012_507);

  assert.equal(response.data.equalPrincipal.repaymentType, "equalPrincipal");
  assert.equal(response.data.equalPrincipal.principal, 100_000_000);
  assert.equal(response.data.equalPrincipal.totalInterest, 20_166_675);
  assert.equal(response.data.equalPrincipal.totalPayment, 120_166_675);
  assert.equal(response.data.equalPrincipal.termMonths, 120);
  assert.equal(response.data.equalPrincipal.baseMonthlyPrincipal, 833_333);
  assert.equal(response.data.equalPrincipal.firstMonthPayment, 1_166_666);
  assert.equal(response.data.equalPrincipal.lastMonthPayment, 836_151);
  assert.equal(response.data.equalPrincipal.firstMonthInterest, 333_333);
  assert.equal(response.data.equalPrincipal.lastMonthInterest, 2_778);

  assert.equal(response.data.bullet.repaymentType, "bullet");
  assert.equal(response.data.bullet.principal, 100_000_000);
  assert.equal(response.data.bullet.totalInterest, 39_999_960);
  assert.equal(response.data.bullet.totalPayment, 139_999_960);
  assert.equal(response.data.bullet.termMonths, 120);
  assert.equal(response.data.bullet.regularMonthlyInterest, 333_333);
  assert.equal(response.data.bullet.maturityMonthPayment, 100_333_333);
  assert.equal(response.data.bullet.maturityMonthPrincipal, 100_000_000);
  assert.equal(response.data.bullet.maturityMonthInterest, 333_333);

  assert.deepEqual(response.data.lowestTotalInterestTypes, ["equalPrincipal"]);
  assert.deepEqual(response.data.lowestFirstMonthPaymentTypes, ["bullet"]);
  assert.deepEqual(response.data.levelPaymentTypes, ["equalPayment"]);
  assert.deepEqual(response.data.totalInterestDifferences, {
    equalPaymentVsEqualPrincipal: 1_327_501,
    equalPaymentVsBullet: 18_505_784,
    equalPrincipalVsBullet: 19_833_285,
  });

  assert.equal(response.data.equalPayment.schedule.length, 120);
  assert.equal(response.data.equalPrincipal.schedule.length, 120);
  assert.equal(response.data.bullet.schedule.length, 120);
  assert.deepEqual(response.data.equalPayment.schedule[0], {
    installmentNumber: 1,
    openingBalance: 100_000_000,
    principalPayment: 679_118,
    interestPayment: 333_333,
    monthlyPayment: 1_012_451,
    closingBalance: 99_320_882,
  });
  assert.deepEqual(response.data.equalPayment.schedule.at(-1), {
    installmentNumber: 120,
    openingBalance: 1_009_143,
    principalPayment: 1_009_143,
    interestPayment: 3_364,
    monthlyPayment: 1_012_507,
    closingBalance: 0,
  });

  assert.match(dataSource, /calculateLoanRepaymentComparison\(/);
  assert.match(dataSource, /if \(!loanInterestExampleResponse\.success\)/);
  assert.doesNotMatch(contentSource, /121,494,176|120,166,675|140,000,000/);
});

test("결과 해석·제외 항목·면책 문구를 제공한다", () => {
  assert.match(contentSource, /총이자와 첫 달 부담은 서로 다른 기준입니다/);
  assert.match(contentSource, /월별 현금흐름과 만기\s+부담을 함께 보고 판단/);
  assert.match(
    dataSource,
    /원금균등상환은 일반적으로 총이자가 적을 수 있지만/,
  );
  assert.match(
    contentSource,
    /대출 가입이나\s+특정 상환방식 선택을 권유하는 자료가 아닙니다/,
  );

  assert.equal(loanInterestExclusions.length, 16);
  assert.match(contentSource, /loanInterestExclusions\.map/);
});

test("FAQ 8개를 한 곳에서 관리하고 FAQPage와 순서가 일치한다", () => {
  const expectedQuestions = [
    "대출이자는 어떻게 계산하나요?",
    "원리금균등과 원금균등의 차이는 무엇인가요?",
    "총이자가 가장 적은 상환방식은 무엇인가요?",
    "월 납입액이 일정한 상환방식은 무엇인가요?",
    "만기일시상환은 마지막 달에 얼마를 내나요?",
    "0% 금리도 계산할 수 있나요?",
    "거치기간과 중도상환수수료도 반영되나요?",
    "실제 은행 상환금액과 계산 결과가 다른 이유는 무엇인가요?",
  ];

  assert.deepEqual(
    loanInterestFaqs.map((faq) => faq.question),
    expectedQuestions,
  );
  assert.equal(loanInterestFaqJsonLd.mainEntity.length, 8);
  assert.match(contentSource, /loanInterestFaqs\.map/);

  for (const [index, faq] of loanInterestFaqs.entries()) {
    assert.equal(loanInterestFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(
      loanInterestFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      faq.answer,
    );
  }
});

test("관련 계산기는 실제 내부 라우트만 링크하고 가짜 링크는 없다", () => {
  assert.match(contentSource, /href="\/calculators\/salary"/);
  assert.match(contentSource, /href="\/calculators\/seller-margin"/);
  assert.doesNotMatch(
    contentSource,
    /href="(?:#|javascript:|\/calculators\/(?:retirement|loan-other|coming-soon))/,
  );
});

test("공식 출처는 현재 접근 가능한 공식 원문만 사용한다", () => {
  assert.equal(loanInterestSources.length, 3);
  assert.match(contentSource, /loanInterestSources\.map/);
  assert.match(contentSource, /target="_blank" rel="noopener noreferrer"/);

  for (const source of loanInterestSources) {
    assert.ok(source.organization.length > 0);
    assert.ok(source.title.length > 0);
    assert.ok(source.criterion.length > 0);
    assert.equal(source.verifiedAt, "2026년 6월 22일");
    assert.match(
      source.href,
      /^https:\/\/(www\.)?(hf\.go\.kr|kinfa\.or\.kr)\//,
    );
  }
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 안전하다", () => {
  const items = [
    loanInterestWebApplicationJsonLd,
    loanInterestBreadcrumbJsonLd,
    loanInterestFaqJsonLd,
  ];

  assert.deepEqual(
    items.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(
    loanInterestWebApplicationJsonLd.applicationCategory,
    "FinanceApplication",
  );
  assert.deepEqual(
    loanInterestBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기 목록", "대출 이자 계산기"],
  );
  assert.deepEqual(
    loanInterestBreadcrumbJsonLd.itemListElement.map((item) => item.item),
    [
      "https://gyesanbox.kr/",
      "https://gyesanbox.kr/calculators",
      "https://gyesanbox.kr/calculators/loan",
    ],
  );

  for (const item of items) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(
      serialized,
      /aggregateRating|review|offers|NaN|Infinity|undefined|localhost|127\.0\.0\.1|pages\.dev|판매자 마진 계산기|연봉 실수령액 계산기/,
    );
  }
});

test("페이지는 공통 JSON-LD와 대출 콘텐츠 컴포넌트를 사용한다", () => {
  assert.match(pageSource, /<JsonLdScripts items=\{jsonLdItems\}/);
  assert.match(pageSource, /loanInterestWebApplicationJsonLd/);
  assert.match(pageSource, /loanInterestBreadcrumbJsonLd/);
  assert.match(pageSource, /loanInterestFaqJsonLd/);
  assert.match(pageSource, /<LoanInterestContent \/>/);
});

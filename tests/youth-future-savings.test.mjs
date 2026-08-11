import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/youth-future-savings/page.tsx";
import {
  calculateYouthFutureSavings,
} from "../lib/calculators/youth-future-savings/index.ts";
import {
  youthFutureSavingsFaqJsonLd,
  youthFutureSavingsFaqs,
} from "../components/calculators/youthFutureSavingsContentData.ts";

test("청년미래적금 계산기는 전용 OG/Twitter 이미지를 사용한다", async () => {
  const image = "https://gyesanbox.kr/og/youth-future-savings.png";
  const png = await readFile("public/og/youth-future-savings.png");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/youth-future-savings/");
  assert.deepEqual(metadata.openGraph.images, [{ url: image, width: 1200, height: 630, alt: "청년미래적금 계산기" }]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.deepEqual(metadata.twitter.images, [image]);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test("청년미래적금 대표 계산 케이스를 계산한다", () => {
  const response = calculateYouthFutureSavings({
    monthlyDeposit: 500_000,
    termMonths: 36,
    annualInterestRate: 7,
    contributionType: "standard",
    taxType: "taxFree",
  });

  assert.equal(response.success, true);

  if (!response.success) {
    return;
  }

  assert.equal(response.data.totalPrincipal, 18_000_000);
  assert.equal(response.data.grossInterest, 1_942_500);
  assert.equal(response.data.interestTax, 0);
  assert.equal(response.data.taxSaving, 299_145);
  assert.equal(response.data.governmentContribution, 1_080_000);
  assert.equal(response.data.maturityAmount, 21_022_500);
  assert.equal(response.data.averageMonthlyBenefit, 83_958);
});

test("최소 납입과 0% 금리에서도 원금과 기여금을 구분한다", () => {
  const response = calculateYouthFutureSavings({
    monthlyDeposit: 1,
    termMonths: 36,
    annualInterestRate: 0,
    contributionType: "standard",
    taxType: "taxFree",
  });

  assert.equal(response.success, true);

  if (!response.success) {
    return;
  }

  assert.equal(response.data.totalPrincipal, 36);
  assert.equal(response.data.grossInterest, 0);
  assert.equal(response.data.governmentContribution, 2);
  assert.equal(response.data.maturityAmount, 38);
});

test("일반과세와 우대형 정부기여금을 구분한다", () => {
  const response = calculateYouthFutureSavings({
    monthlyDeposit: 500_000,
    termMonths: 36,
    annualInterestRate: 7,
    contributionType: "preferred",
    taxType: "taxable",
  });

  assert.equal(response.success, true);

  if (!response.success) {
    return;
  }

  assert.equal(response.data.governmentContribution, 2_160_000);
  assert.equal(response.data.interestTax, 299_145);
  assert.equal(response.data.taxSaving, 0);
  assert.equal(response.data.maturityAmount, 21_803_355);
});

test("금융위원회 공식 예시와 현재 단순 계산식의 차이를 구분한다", () => {
  const cases = [
    {
      input: {
        monthlyDeposit: 500_000,
        termMonths: 36,
        annualInterestRate: 7,
        contributionType: "standard",
        taxType: "taxFree",
      },
      officialApproxMaturityAmount: 21_100_000,
      expectedMaturityAmount: 21_022_500,
      expectedGrossInterest: 1_942_500,
    },
    {
      input: {
        monthlyDeposit: 500_000,
        termMonths: 36,
        annualInterestRate: 7,
        contributionType: "preferred",
        taxType: "taxFree",
      },
      officialApproxMaturityAmount: 22_270_000,
      expectedMaturityAmount: 22_102_500,
      expectedGrossInterest: 1_942_500,
    },
    {
      input: {
        monthlyDeposit: 500_000,
        termMonths: 36,
        annualInterestRate: 8,
        contributionType: "standard",
        taxType: "taxFree",
      },
      officialApproxMaturityAmount: 21_380_000,
      expectedMaturityAmount: 21_300_000,
      expectedGrossInterest: 2_220_000,
    },
    {
      input: {
        monthlyDeposit: 500_000,
        termMonths: 36,
        annualInterestRate: 8,
        contributionType: "preferred",
        taxType: "taxFree",
      },
      officialApproxMaturityAmount: 22_550_000,
      expectedMaturityAmount: 22_380_000,
      expectedGrossInterest: 2_220_000,
    },
  ];

  for (const {
    input,
    officialApproxMaturityAmount,
    expectedMaturityAmount,
    expectedGrossInterest,
  } of cases) {
    const response = calculateYouthFutureSavings(input);

    assert.equal(response.success, true);

    if (!response.success) {
      continue;
    }

    assert.equal(response.data.maturityAmount, expectedMaturityAmount);
    assert.equal(response.data.grossInterest, expectedGrossInterest);
    assert.notEqual(response.data.maturityAmount, officialApproxMaturityAmount);
  }
});

test("직접 입력 정부기여금을 계산한다", () => {
  const rateResponse = calculateYouthFutureSavings({
    monthlyDeposit: 200_000,
    termMonths: 12,
    annualInterestRate: 5,
    contributionType: "customRate",
    customContributionRate: 10,
    taxType: "taxFree",
  });
  const monthlyResponse = calculateYouthFutureSavings({
    monthlyDeposit: 200_000,
    termMonths: 12,
    annualInterestRate: 5,
    contributionType: "customMonthly",
    customMonthlyContribution: 25_000,
    taxType: "taxFree",
  });

  assert.equal(rateResponse.success, true);
  assert.equal(monthlyResponse.success, true);

  if (rateResponse.success) {
    assert.equal(rateResponse.data.governmentContribution, 240_000);
  }
  if (monthlyResponse.success) {
    assert.equal(monthlyResponse.data.governmentContribution, 300_000);
  }
});

test("입력 오류와 경계값을 방어한다", () => {
  const response = calculateYouthFutureSavings({
    monthlyDeposit: 500_001,
    termMonths: 37,
    annualInterestRate: 31,
    contributionType: "customRate",
    customContributionRate: -1,
    taxType: "taxFree",
  });

  assert.equal(response.success, false);

  if (response.success) {
    return;
  }

  assert.deepEqual(
    response.errors.map((error) => error.code),
    [
      "MONTHLY_DEPOSIT_EXCEEDS_LIMIT",
      "TERM_EXCEEDS_LIMIT",
      "RATE_EXCEEDS_LIMIT",
      "MUST_BE_NON_NEGATIVE",
    ],
  );
});

test("NaN과 Infinity 입력을 거부한다", () => {
  const response = calculateYouthFutureSavings({
    monthlyDeposit: Number.NaN,
    termMonths: Number.POSITIVE_INFINITY,
    annualInterestRate: 7,
    contributionType: "standard",
    taxType: "taxFree",
  });

  assert.equal(response.success, false);

  if (!response.success) {
    assert.match(
      response.errors.map((error) => error.message).join(" "),
      /숫자|개월 수/,
    );
  }
});

test("라우트는 canonical을 가진 공개 페이지다", async () => {
  const source = await readFile(
    "app/calculators/youth-future-savings/page.tsx",
    "utf8",
  );

  assert.match(source, /canonical/);
  assert.doesNotMatch(source, /isYouthFutureSavingsEnabled|notFound\(\)|index:\s*false/);
});

test("sitemap, 목록, 홈에는 청년미래적금 계산기를 노출한다", async () => {
  const files = [
    "app/sitemap.ts",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "app/calculators/salary/page.tsx",
    "app/calculators/loan/page.tsx",
    "app/calculators/seller-margin/page.tsx",
    "app/calculators/severance/page.tsx",
    "app/calculators/unemployment/page.tsx",
  ];

  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  assert.match(sources[0], /youth-future-savings/);
  assert.match(sources[1], /youth-future-savings|청년미래적금 계산기/);
  assert.match(sources[2], /youth-future-savings|청년미래적금 계산기/);
});

test("Cloudflare 검증은 청년미래적금 산출물을 비공개 산출물로 차단한다", async () => {
  const source = await readFile("scripts/verify-cloudflare-pages.mjs", "utf8");

  assert.match(source, /out\/calculators\/youth-future-savings/);
  assert.match(source, /youth-future-savings/);
});

test("FAQ 화면 데이터와 FAQPage JSON-LD 데이터가 일치한다", () => {
  assert.deepEqual(
    youthFutureSavingsFaqJsonLd.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    youthFutureSavingsFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  );
});

test("검색의도 안내는 자격 자동 판정을 주장하지 않고 최신 공식 출처를 제공한다", async () => {
  const [pageSource, contentSource] = await Promise.all([
    readFile("app/calculators/youth-future-savings/page.tsx", "utf8"),
    readFile("components/calculators/youthFutureSavingsContentData.ts", "utf8"),
  ]);

  assert.match(pageSource, /정부기여금·만기 예상금액/);
  assert.match(pageSource, /예금·적금 이자 계산기/);
  assert.match(pageSource, /연봉 실수령액 계산기/);
  assert.match(contentSource, /가입 가능 여부를 자동 판정하지 않습니다/);
  assert.match(contentSource, /https:\/\/www\.kinfa\.or\.kr\/financialProduct\/youthFutureSavings\.do/);
  assert.match(contentSource, /청년도약계좌와의 중복 가입은 제한됩니다/);
});

test("화면 설명은 공식 예시와 다른 단순 계산 기준을 명시한다", async () => {
  const source = await readFile(
    "components/calculators/youthFutureSavingsContentData.ts",
    "utf8",
  );

  assert.match(source, /정부기여금의 지급 시점과 별도 이자 효과를 반영하지 않습니다/);
  assert.match(source, /보도자료의 예시는 약식 표기/);
  assert.match(source, /월 납입 원금의 단리 예상 이자와 정부기여금 원금을 분리/);
});

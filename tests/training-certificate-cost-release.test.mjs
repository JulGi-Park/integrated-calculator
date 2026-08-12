import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isTrainingCertificateCostCalculatorEnabled,
  TRAINING_CERTIFICATE_COST_PUBLICATION,
} from "../lib/calculators/training-certificate-cost/publication.ts";

test("공개 조건은 정확한 소문자 true만 허용한다", () => {
  for (const [value, expected] of [
    [undefined, false],
    ["", false],
    ["false", false],
    ["TRUE", false],
    ["1", false],
    ["yes", false],
    ["true", true],
  ]) {
    assert.equal(
      isTrainingCertificateCostCalculatorEnabled(value),
      expected,
      String(value),
    );
  }
});

test("공개 정보는 canonical 경로와 2026-08-12 공개 준비 기준을 유지한다", () => {
  assert.deepEqual(TRAINING_CERTIFICATE_COST_PUBLICATION, {
    environmentVariable:
      "NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR",
    name: "국비지원 자격증 취득비용 계산기",
    slug: "training-certificate-cost",
    path: "/calculators/training-certificate-cost/",
    url: "https://gyesanbox.kr/calculators/training-certificate-cost/",
    category: "급여",
    description:
      "내일배움카드 훈련비 본인부담금과 시험·교재·재료비 등을 합산해 자격증 취득 예상비용을 계산합니다.",
    releasedAt: "2026-08-12",
  });
});

test("모든 공개 진입점과 Registry는 같은 strict helper를 사용한다", async () => {
  for (const path of [
    "app/calculators/training-certificate-cost/page.tsx",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "app/sitemap.ts",
    "app/about/page.tsx",
    "app/updates/page.tsx",
    "lib/favorites.ts",
  ]) {
    const source = await readFile(path, "utf8");
    assert.match(source, /isTrainingCertificateCostCalculatorEnabled\(\)/, path);
  }
});

test("공개 변경 이력과 관련 계산기는 기능 범위를 과장하지 않는다", async () => {
  const updates = await readFile("app/updates/page.tsx", "utf8");
  const contentData = await readFile(
    "components/calculators/trainingCertificateCostContentData.ts",
    "utf8",
  );

  assert.match(updates, /2026년 8월 12일/);
  assert.match(updates, /국비지원 자격증 취득비용 계산기 공개/);
  assert.match(updates, /지원 자격을 판정하지 않고/);
  assert.match(updates, /재응시 횟수별 예상비용/);
  assert.equal(
    (contentData.match(/href: "\/calculators\/(?:unemployment|salary|work-child-incentive)\/"/g) ?? []).length,
    3,
  );
});

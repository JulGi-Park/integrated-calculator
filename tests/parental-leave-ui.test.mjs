import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("육아휴직급여 UI는 필수 문구와 제외 범위를 표시한다", async () => {
  const [calculatorSource, contentSource, dataSource] = await Promise.all([
    readFile("components/calculators/ParentalLeaveCalculator.tsx", "utf8"),
    readFile("components/calculators/ParentalLeaveContent.tsx", "utf8"),
    readFile("components/calculators/parentalLeaveContentData.ts", "utf8"),
  ]);
  const source = [calculatorSource, contentSource, dataSource].join("\n");

  for (const pattern of [
    /육아휴직급여 계산기/,
    /계산 기준일/,
    /월 통상임금/,
    /육아휴직 사용 개월 수/,
    /총 예상 수령액/,
    /월별 예상 육아휴직급여/,
    /부모 함께 육아휴직제 6\+6/,
    /한부모 육아휴직 특례/,
    /특례 조건/,
    /임의로 더 유리한 특례를 자동 선택하지 않습니다/,
    /확정 지급액이 아닌 예상값/,
    /고용센터 심사/,
    /결과 복사/,
    /결과 공유/,
  ]) {
    assert.match(source, pattern);
  }
});

test("육아휴직급여 콘텐츠는 FAQ, 공식 출처, 면책 문구를 포함한다", async () => {
  const source = await readFile(
    "components/calculators/parentalLeaveContentData.ts",
    "utf8",
  );
  const faqCount = [...source.matchAll(/question:/g)].length;

  assert.ok(faqCount >= 6, "FAQ는 최소 6개 이상이어야 합니다.");
  assert.match(source, /고용24/);
  assert.match(source, /국가법령정보센터/);
  assert.match(source, /고용보험법 시행령 제95조/);
});

test("육아휴직급여 콘텐츠는 실제 계산 모드 범위와 일치하고 내부 구현 용어를 노출하지 않는다", async () => {
  const source = await readFile(
    "components/calculators/ParentalLeaveContent.tsx",
    "utf8",
  );
  const dataSource = await readFile(
    "components/calculators/parentalLeaveContentData.ts",
    "utf8",
  );
  const combined = `${source}\n${dataSource}`;

  assert.doesNotMatch(combined, /특례 계산 구조화 상태/);
  assert.doesNotMatch(combined, /일반 육아휴직급여만 계산/);
  assert.match(combined, /일반 육아휴직급여/);
  assert.match(combined, /부모 함께 육아휴직제 6\+6/);
  assert.match(combined, /한부모 특례/);
  assert.match(combined, /사용자가 선택한 계산 모드/);
  assert.match(combined, /자격을 판정하지\s*않으며/);
  assert.match(combined, /실제 지급 여부는 고용24 또는 관할 기관에서 확인/);
});

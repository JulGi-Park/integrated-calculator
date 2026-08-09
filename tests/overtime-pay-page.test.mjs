import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const [pageSource, contentSource, calculatorSource, clientUtilsSource] = await Promise.all([
  readFile("app/calculators/overtime-pay/page.tsx", "utf8"),
  readFile("components/calculators/OvertimePayContent.tsx", "utf8"),
  readFile("components/calculators/OvertimePayCalculator.tsx", "utf8"),
  readFile("components/calculators/overtimePayClientUtils.ts", "utf8"),
]);

test("야간·연장·휴일근로 검색 의도와 5인 이상 적용 범위를 설명한다", () => {
  assert.match(pageSource, /야간수당 계산기 2026 - 연장근로·휴일근로수당 자동 계산/);
  assert.match(contentSource, /상시근로자 5인 이상 사업장/);
  assert.match(contentSource, /오후 10시부터 다음 날 오전 6시/);
  assert.match(contentSource, /이내분을 통상시급의 1.5배, 초과분을 2.0배/);
  assert.match(contentSource, /연장근로 또는 휴일근로와 겹친 시간만큼 야간근로에도 함께 입력/);
});

test("화면 FAQ와 FAQPage JSON-LD는 같은 데이터에서 생성된다", () => {
  assert.match(contentSource, /야간수당은 몇 시부터 계산하나요/);
  assert.match(contentSource, /통상시급에는 무엇을 입력하나요/);
  assert.match(contentSource, /mainEntity: overtimePayFaqs\.map/);
  assert.match(contentSource, /overtimePayFaqs\.map/);
});

test("중복되는 결과 카드는 화면과 복사 결과에서 제거한다", () => {
  assert.doesNotMatch(calculatorSource, /일반 근로 대비 추가 금액/);
  assert.doesNotMatch(clientUtilsSource, /일반 근로 대비 추가 금액/);
  assert.match(calculatorSource, /가산수당 합계/);
});

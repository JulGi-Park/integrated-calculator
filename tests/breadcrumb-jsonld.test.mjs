import assert from "node:assert/strict";
import test from "node:test";
import { loanInterestBreadcrumbJsonLd } from "../components/calculators/loanInterestContentData.ts";
import { salaryTakeHomeBreadcrumbJsonLd } from "../components/calculators/salaryTakeHomeContentData.ts";
import { sellerMarginBreadcrumbJsonLd } from "../components/calculators/sellerMarginContentData.ts";
import { severanceBreadcrumbJsonLd } from "../components/calculators/severanceContentData.ts";
import { unemploymentBreadcrumbJsonLd } from "../components/calculators/unemploymentContentData.ts";

const expectedBreadcrumbs = [
  {
    name: "seller-margin",
    data: sellerMarginBreadcrumbJsonLd,
    items: [
      ["홈", "https://gyesanbox.kr/"],
      ["계산기 목록", "https://gyesanbox.kr/calculators"],
      ["판매자 마진 계산기", "https://gyesanbox.kr/calculators/seller-margin"],
    ],
  },
  {
    name: "salary",
    data: salaryTakeHomeBreadcrumbJsonLd,
    items: [
      ["홈", "https://gyesanbox.kr/"],
      ["계산기 목록", "https://gyesanbox.kr/calculators"],
      ["연봉 실수령액 계산기", "https://gyesanbox.kr/calculators/salary"],
    ],
  },
  {
    name: "loan",
    data: loanInterestBreadcrumbJsonLd,
    items: [
      ["홈", "https://gyesanbox.kr/"],
      ["계산기 목록", "https://gyesanbox.kr/calculators"],
      ["대출 이자 계산기", "https://gyesanbox.kr/calculators/loan"],
    ],
  },
  {
    name: "severance",
    data: severanceBreadcrumbJsonLd,
    items: [
      ["홈", "https://gyesanbox.kr/"],
      ["계산기 목록", "https://gyesanbox.kr/calculators"],
      ["퇴직금 계산기", "https://gyesanbox.kr/calculators/severance"],
    ],
  },
  {
    name: "unemployment",
    data: unemploymentBreadcrumbJsonLd,
    items: [
      ["홈", "https://gyesanbox.kr/"],
      ["계산기 목록", "https://gyesanbox.kr/calculators"],
      ["실업급여 계산기", "https://gyesanbox.kr/calculators/unemployment"],
    ],
  },
];

test("계산기 BreadcrumbList의 모든 ListItem은 운영 절대 URL item을 가진다", () => {
  for (const { name, data, items } of expectedBreadcrumbs) {
    assert.equal(data["@context"], "https://schema.org", name);
    assert.equal(data["@type"], "BreadcrumbList", name);
    assert.equal(data.itemListElement.length, items.length, name);

    data.itemListElement.forEach((item, index) => {
      assert.equal(item["@type"], "ListItem", name);
      assert.equal(item.position, index + 1, name);
      assert.equal(item.name, items[index][0], name);
      assert.equal(item.item, items[index][1], name);
      assert.match(item.item, /^https:\/\/gyesanbox\.kr(?:\/|\/.+)$/);
    });
  }
});

export type FavoriteItem = { path: string; addedAt: number };

export const FAVORITES_STORAGE_KEY = "gyesanbox:favorites:v1";
export const MAX_FAVORITES = 50;

export type BookmarkablePage = {
  id: string;
  path: string;
  title: string;
  type: "calculator" | "guide" | "hub";
  bookmarkable: true;
};

export function getBookmarkablePages(
  trainingCertificateCostEnabled =
    isTrainingCertificateCostCalculatorEnabled(),
): BookmarkablePage[] {
  return [
  ["calculators", "/calculators/", "계산기 목록", "hub"],
  ["salary", "/calculators/salary/", "연봉 실수령액 계산기", "calculator"],
  ["social-insurance", "/calculators/social-insurance/", "2026 4대보험 계산기", "calculator"],
  ["labor-pay", "/calculators/labor-pay/", "주휴수당 계산기", "calculator"],
  ["severance", "/calculators/severance/", "퇴직금 계산기", "calculator"],
  ["unemployment", "/calculators/unemployment/", "실업급여 계산기", "calculator"],
  ["parental-leave", "/calculators/parental-leave/", "육아휴직급여 계산기", "calculator"],
  ["loan", "/calculators/loan/", "대출 이자 계산기·원리금 계산기", "calculator"],
  ["rent-vs-jeonse", "/calculators/rent-vs-jeonse/", "전세 vs 월세 계산기", "calculator"],
  ["seller-margin", "/calculators/seller-margin/", "판매자 마진 계산기", "calculator"],
  ["vat-profit", "/calculators/vat-profit/", "부가세 계산기", "calculator"],
  ["roas", "/calculators/roas/", "ROAS 계산기", "calculator"],
  ["savings", "/calculators/savings/", "예금·적금 계산기", "calculator"],
  ["average-price", "/calculators/average-price/", "물타기 계산기", "calculator"],
  ["card-installment", "/calculators/card-installment/", "카드 할부 계산기", "calculator"],
  ["brokerage-fee", "/calculators/brokerage-fee/", "부동산 중개보수 계산기", "calculator"],
  ["car-cost", "/calculators/car-cost/", "자동차 유지비 계산기", "calculator"],
  ["overtime-pay", "/calculators/overtime-pay/", "연장·야간·휴일근로수당 계산기", "calculator"],
  ["youth-future-savings", "/calculators/youth-future-savings/", "청년미래적금 계산기", "calculator"],
  ["dsr", "/calculators/dsr/", "DSR 계산기", "calculator"],
  ["work-child-incentive", "/calculators/work-child-incentive/", "근로·자녀장려금 계산기", "calculator"],
  ...(trainingCertificateCostEnabled
    ? [[
        TRAINING_CERTIFICATE_COST_PUBLICATION.slug,
        TRAINING_CERTIFICATE_COST_PUBLICATION.path,
        TRAINING_CERTIFICATE_COST_PUBLICATION.name,
        "calculator",
      ]]
    : []),
  ["methodology", "/methodology/", "계산 방법론", "guide"],
  ["updates", "/updates/", "계산기 변경 이력", "guide"],
  ].map(
    ([id, path, title, type]) =>
      ({ id, path, title, type, bookmarkable: true }) as BookmarkablePage,
  );
}

export const BOOKMARKABLE_PAGES = getBookmarkablePages();

const allowedPaths = new Set(BOOKMARKABLE_PAGES.map((page) => page.path));

export function normalizeFavoritePath(value: string): string | null {
  try {
    const url = new URL(value, "https://gyesanbox.kr");
    if (url.origin !== "https://gyesanbox.kr") return null;
    let path = url.pathname || "/";
    if (!path.endsWith("/")) path += "/";
    return allowedPaths.has(path) ? path : null;
  } catch {
    return null;
  }
}

export function getFavoritePage(path: string) {
  return BOOKMARKABLE_PAGES.find((page) => page.path === path);
}

export function parseFavorites(raw: string | null): FavoriteItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const items: FavoriteItem[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object" || typeof (item as { path?: unknown }).path !== "string") continue;
      const path = normalizeFavoritePath((item as { path: string }).path);
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const addedAt = Number((item as { addedAt?: unknown }).addedAt);
      items.push({ path, addedAt: Number.isFinite(addedAt) && addedAt >= 0 ? addedAt : 0 });
      if (items.length >= MAX_FAVORITES) break;
    }
    return items;
  } catch {
    return [];
  }
}

export function serializeFavorites(items: FavoriteItem[]): string {
  return JSON.stringify(items.slice(0, MAX_FAVORITES));
}
import {
  isTrainingCertificateCostCalculatorEnabled,
  TRAINING_CERTIFICATE_COST_PUBLICATION,
} from "@/lib/calculators/training-certificate-cost/publication";

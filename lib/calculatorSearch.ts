import type { CalculatorRegistryItem } from "./calculatorRegistry";

export type CalculatorSearchMatch = {
  calculator: CalculatorRegistryItem;
  score: number;
  matchedBy: "title-exact" | "title" | "alias" | "intent" | "category" | "description";
};

export function normalizeCalculatorQuery(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function compact(value: string) {
  return normalizeCalculatorQuery(value).replaceAll(" ", "");
}

export function searchCalculators(
  calculators: readonly CalculatorRegistryItem[],
  rawQuery: string,
): CalculatorSearchMatch[] {
  const query = normalizeCalculatorQuery(rawQuery);
  if (!query) {
    return calculators.map((calculator) => ({ calculator, score: 0, matchedBy: "description" }));
  }
  const compactQuery = compact(query);

  return calculators
    .map((calculator, index) => {
      const title = normalizeCalculatorQuery(calculator.title);
      const fields: Array<[CalculatorSearchMatch["matchedBy"], readonly string[], number]> = [
        ["alias", calculator.searchAliases, 300],
        ["intent", calculator.searchIntents, 220],
        ["category", [calculator.category], 160],
        ["description", [calculator.description, calculator.inputOutput ?? ""], 100],
      ];

      if (compact(title) === compactQuery) {
        return { calculator, score: 500, matchedBy: "title-exact" as const, index };
      }
      if (compact(title).includes(compactQuery)) {
        return { calculator, score: 400, matchedBy: "title" as const, index };
      }
      for (const [matchedBy, values, baseScore] of fields) {
        const exact = values.some((value) => compact(value) === compactQuery);
        if (exact) return { calculator, score: baseScore + 20, matchedBy, index };
        // Preserve word boundaries for phrase matching. Compacting would make
        // `세전 세후` falsely match the unrelated query `전세`.
        const partial = values.some((value) => normalizeCalculatorQuery(value).includes(query));
        if (partial) return { calculator, score: baseScore, matchedBy, index };
      }
      return null;
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ calculator, score, matchedBy }) => ({ calculator, score, matchedBy }));
}

export function getPredefinedSearchId(
  calculators: readonly CalculatorRegistryItem[],
  rawQuery: string,
): string | undefined {
  const query = compact(rawQuery);
  if (!query) return undefined;
  for (const calculator of calculators) {
    if (compact(calculator.title) === query) return `title:${calculator.id}`;
    if (calculator.searchAliases.some((alias) => compact(alias) === query)) {
      return `alias:${calculator.id}`;
    }
    if (calculator.searchIntents.some((intent) => compact(intent) === query)) {
      return `intent:${calculator.id}`;
    }
  }
  return undefined;
}

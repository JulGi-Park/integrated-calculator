"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalculatorRegistryItem } from "@/lib/calculatorRegistry";
import {
  getPredefinedSearchId,
  normalizeCalculatorQuery,
  searchCalculators,
} from "@/lib/calculatorSearch";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendSearchEvent(eventName: "calculator_search" | "calculator_search_select", values: Record<string, unknown>) {
  window.gtag?.("event", eventName, values);
}

export function CalculatorCategoryFilter({ calculators }: { calculators: readonly CalculatorRegistryItem[] }) {
  const categories = useMemo(
    () => ["전체", ...new Set(calculators.map((calculator) => calculator.category))],
    [calculators],
  );
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const normalizedQuery = normalizeCalculatorQuery(query);
  const searchResults = useMemo(() => searchCalculators(calculators, query), [calculators, query]);
  const visibleResults = useMemo(
    () =>
      searchResults.filter(
        ({ calculator }) => selectedCategory === "전체" || calculator.category === selectedCategory,
      ),
    [searchResults, selectedCategory],
  );

  useEffect(() => {
    if (!normalizedQuery || isComposing) return;
    const timeoutId = window.setTimeout(() => {
      const categoriesFound = [...new Set(visibleResults.map(({ calculator }) => calculator.category))];
      sendSearchEvent("calculator_search", {
        result_count: visibleResults.length,
        matched_category: categoriesFound.length === 1 ? categoriesFound[0] : "multiple",
        matched_calculator_id: visibleResults.length === 1 ? visibleResults[0].calculator.id : undefined,
        predefined_search_id: getPredefinedSearchId(calculators, query),
      });
    }, 600);
    return () => window.clearTimeout(timeoutId);
  }, [calculators, isComposing, normalizedQuery, query, visibleResults]);

  const resetSearch = () => {
    setQuery("");
    setSelectedCategory("전체");
  };

  return (
    <>
      <div className="calculator-search-panel">
        <div className="calculator-search-panel__heading">
          <div>
            <h2>어떤 계산기를 찾으세요?</h2>
            <p>이름뿐 아니라 “퇴사”, “알바”, “대출 한도”처럼 필요한 상황으로도 찾을 수 있습니다.</p>
          </div>
          <strong>{calculators.length}개 계산기</strong>
        </div>
        <div className="calculator-search" role="search">
          <label htmlFor="calculator-search-input">계산기 검색</label>
          <div className="calculator-search__control">
            <input
              id="calculator-search-input"
              type="search"
              value={query}
              autoComplete="off"
              enterKeyHint="search"
              aria-controls="calculator-search-results"
              onChange={(event) => setQuery(event.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(event) => {
                setIsComposing(false);
                setQuery(event.currentTarget.value);
              }}
            />
            {query ? (
              <button
                type="button"
                className="calculator-search__clear"
                aria-label="계산기 검색어 지우기"
                onClick={() => setQuery("")}
              >
                지우기
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="calculator-filter" aria-label="계산기 카테고리">
        <span className="calculator-filter__label">카테고리</span>
        <div className="calculator-filter__buttons" role="group" aria-label="계산기 카테고리 선택">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              aria-pressed={selectedCategory === category}
              className={selectedCategory === category ? "is-selected" : undefined}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <span className="calculator-filter__status" role="status" aria-live="polite">
          {normalizedQuery
            ? `${visibleResults.length}개 검색 결과`
            : selectedCategory === "전체"
              ? `전체 ${calculators.length}개 계산기`
              : `${selectedCategory} 계산기 ${visibleResults.length}개`}
        </span>
      </div>

      <div className="calculator-grid" id="calculator-search-results">
        {visibleResults.map(({ calculator, matchedBy }) => (
          <a
            className="calculator-card"
            data-category={calculator.category}
            data-calculator-id={calculator.id}
            href={calculator.path}
            key={calculator.path}
            onClick={() =>
              sendSearchEvent("calculator_search_select", {
                selected_calculator_id: calculator.id,
                result_count: visibleResults.length,
                matched_category: calculator.category,
                match_type: normalizedQuery ? matchedBy : "browse",
                predefined_search_id: getPredefinedSearchId(calculators, query),
              })
            }
          >
            <div>
              <span className="calculator-card__category">{calculator.category}</span>
              <h2>{calculator.title}</h2>
              <p>{calculator.description}</p>
              {calculator.inputOutput ? <p>{calculator.inputOutput}</p> : null}
            </div>
            <span className="calculator-card__arrow" aria-hidden="true">→</span>
          </a>
        ))}
      </div>

      {visibleResults.length === 0 ? (
        <div className="calculator-search-empty" role="status">
          <h2>찾는 계산기가 없습니다.</h2>
          <p>다른 단어로 검색하거나 전체 계산기 목록으로 돌아가세요.</p>
          <button type="button" onClick={resetSearch}>전체 계산기 보기</button>
        </div>
      ) : null}
    </>
  );
}

"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

type CalculatorCardProps = {
  "data-category"?: string;
  hidden?: boolean;
  "aria-hidden"?: boolean;
};

type CalculatorCard = ReactElement<CalculatorCardProps>;

function isCalculatorCard(child: ReactNode): child is CalculatorCard {
  return isValidElement<CalculatorCardProps>(child) && Boolean(child.props["data-category"]);
}

export function CalculatorCategoryFilter({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children).filter(isCalculatorCard);
  const categories = useMemo(
    () => [
      "전체",
      ...new Set(
        cards
          .map((card) => card.props["data-category"])
          .filter((category): category is string => Boolean(category)),
      ),
    ],
    [cards],
  );
  const [selectedCategory, setSelectedCategory] = useState("전체");

  return (
    <>
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
          {selectedCategory === "전체" ? "전체 계산기" : `${selectedCategory} 계산기`} 보기
        </span>
      </div>

      <div className="calculator-grid">
        {cards.map((card) => {
          const isHidden =
            selectedCategory !== "전체" && card.props["data-category"] !== selectedCategory;
          return cloneElement(card, {
            hidden: isHidden,
            "aria-hidden": isHidden,
          });
        })}
      </div>
    </>
  );
}

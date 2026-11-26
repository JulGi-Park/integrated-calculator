import type { HTMLAttributes } from "react";
import styles from "./CalculatorLayout.module.css";

type CalculatorLayoutProps = HTMLAttributes<HTMLDivElement>;

export function CalculatorLayout({ className, ...props }: CalculatorLayoutProps) {
  return (
    <div
      {...props}
      className={`${styles.layout} ${className ?? ""}`.trim()}
    />
  );
}

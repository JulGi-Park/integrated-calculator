import type { ReactNode } from "react";
import styles from "./CompactCalculatorHero.module.css";

type CompactCalculatorHeroProps = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  meta: ReactNode;
  className?: string;
};

export function CompactCalculatorHero({
  eyebrow,
  title,
  description,
  meta,
  className,
}: CompactCalculatorHeroProps) {
  return (
    <header className={`page-heading ${styles.hero} ${className ?? ""}`.trim()}>
      <p className="page-heading__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={`seller-margin-meta ${styles.meta}`}>{meta}</div>
    </header>
  );
}

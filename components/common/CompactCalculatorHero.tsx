import type { ReactNode } from "react";
import styles from "./CompactCalculatorHero.module.css";

type CompactCalculatorHeroProps = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  meta: ReactNode;
  className?: string;
  metaBeforeDescription?: boolean;
};

export function CompactCalculatorHero({
  eyebrow,
  title,
  description,
  meta,
  className,
  metaBeforeDescription = false,
}: CompactCalculatorHeroProps) {
  return (
    <header className={`page-heading ${styles.hero} ${className ?? ""}`.trim()}>
      <p className="page-heading__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {metaBeforeDescription && (
        <div className={`seller-margin-meta ${styles.meta}`}>{meta}</div>
      )}
      <p className={styles.description}>{description}</p>
      {!metaBeforeDescription && (
        <div className={`seller-margin-meta ${styles.meta}`}>{meta}</div>
      )}
    </header>
  );
}

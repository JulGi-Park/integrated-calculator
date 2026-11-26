import styles from "./RatioBar.module.css";

type RatioBarProps = {
  total: number;
  value: number;
  valueLabel: string;
  remainderLabel: string;
  formatValue?: (value: number) => string;
  className?: string;
};

const percentFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});

const defaultValueFormatter = (value: number) =>
  value.toLocaleString("ko-KR");

export function RatioBar({
  total,
  value,
  valueLabel,
  remainderLabel,
  formatValue = defaultValueFormatter,
  className,
}: RatioBarProps) {
  if (
    !Number.isFinite(total) ||
    !Number.isFinite(value) ||
    total <= 0 ||
    value < 0 ||
    value > total
  ) {
    return (
      <p className={`${styles.unavailable} ${className ?? ""}`.trim()} role="note">
        비율을 계산할 수 있는 금액이 없습니다.
      </p>
    );
  }

  const valuePercent = (value / total) * 100;
  const remainder = total - value;
  const remainderPercent = 100 - valuePercent;
  const valuePercentText = `${percentFormatter.format(valuePercent)}%`;
  const remainderPercentText = `${percentFormatter.format(remainderPercent)}%`;

  return (
    <figure className={`${styles.figure} ${className ?? ""}`.trim()}>
      <figcaption className={styles.caption}>월 급여 구성</figcaption>
      <div
        className={styles.track}
        role="img"
        aria-label={`${valueLabel} ${valuePercentText}, ${remainderLabel} ${remainderPercentText}`}
      >
        <span
          className={styles.value}
          style={{ width: `${valuePercent}%` }}
        />
      </div>
      <div className={styles.legend}>
        <span>
          <i className={styles.valueMarker} aria-hidden="true" />
          {valueLabel} <strong>{valuePercentText}</strong>
          <small>{formatValue(value)}</small>
        </span>
        <span>
          <i className={styles.remainderMarker} aria-hidden="true" />
          {remainderLabel} <strong>{remainderPercentText}</strong>
          <small>{formatValue(remainder)}</small>
        </span>
      </div>
    </figure>
  );
}

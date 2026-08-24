import styles from "./ResultDecisionLayer.module.css";

type ResultDecisionLayerProps = {
  meaning: string;
  appliedRules: readonly string[];
  drivers: readonly string[];
  verificationHints: readonly string[];
  differenceReasons: readonly string[];
};

export function ResultDecisionLayer({
  meaning,
  appliedRules,
  drivers,
  verificationHints,
  differenceReasons,
}: ResultDecisionLayerProps) {
  return (
    <section className={styles.layer} aria-label="계산 결과 판단 안내">
      <div className={styles.heading}>
        <p>RESULT GUIDE</p>
        <h3>이 결과를 다음 판단에 연결하기</h3>
      </div>
      <p className={styles.meaning}>{meaning}</p>
      <div className={styles.grid}>
        <article>
          <h4>이번 계산에 적용된 조건</h4>
          <ul>{appliedRules.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <h4>결과를 크게 바꾸는 입력</h4>
          <ul>{drivers.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <h4>실제 자료와 확인할 것</h4>
          <ul>{verificationHints.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <h4>실제값과 달라질 수 있는 이유</h4>
          <ul>{differenceReasons.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}

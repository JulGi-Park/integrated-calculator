import styles from "./CalculatorHeroImage.module.css";

type CalculatorHeroImageProps = {
  src: string;
  alt: string;
};

export function CalculatorHeroImage({ src, alt }: CalculatorHeroImageProps) {
  return (
    <figure className={styles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={1200}
        height={630}
        loading="eager"
        decoding="async"
      />
    </figure>
  );
}

import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import styles from "./CalculatorPanel.module.css";

type FormPanelProps = Omit<ComponentPropsWithoutRef<"form">, "children"> & {
  as: "form";
  children: ReactNode;
};

type SectionPanelProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  as: "section";
  children: ReactNode;
};

type CalculatorPanelProps = FormPanelProps | SectionPanelProps;

export function CalculatorPanel(props: CalculatorPanelProps) {
  const { as, className, children, ...elementProps } = props;
  if (as === "form") {
    return (
      <form
        {...elementProps}
        className={`${styles.panel} ${className ?? ""}`.trim()}
      >
        {children}
      </form>
    );
  }

  return (
    <section
      {...elementProps}
      className={`${styles.panel} ${className ?? ""}`.trim()}
    >
      {children}
    </section>
  );
}

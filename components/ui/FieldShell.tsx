import type { HTMLAttributes, ReactNode } from "react";
import styles from "./FieldShell.module.css";

type FieldShellProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean;
  children: ReactNode;
};

export function FieldShell({
  className,
  invalid = false,
  ...props
}: FieldShellProps) {
  return (
    <div
      {...props}
      className={`${styles.shell} ${invalid ? styles.invalid : ""} ${className ?? ""}`.trim()}
    />
  );
}

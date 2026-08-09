export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatHours(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  })}시간`;
}

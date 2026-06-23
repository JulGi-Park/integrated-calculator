export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAYS_BEFORE_MONTH = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
] as const;

export function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseCivilDate(value: string): CivilDate | null {
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > getDaysInMonth(year, month)
  ) {
    return null;
  }

  return { year, month, day };
}

export function formatCivilDate(date: CivilDate): string {
  return [
    date.year.toString().padStart(4, "0"),
    date.month.toString().padStart(2, "0"),
    date.day.toString().padStart(2, "0"),
  ].join("-");
}

export function civilDateToOrdinal(date: CivilDate): number {
  const priorYear = date.year - 1;
  const leapDays =
    Math.floor(priorYear / 4) -
    Math.floor(priorYear / 100) +
    Math.floor(priorYear / 400);
  const currentYearLeapDay =
    date.month > 2 && isLeapYear(date.year) ? 1 : 0;

  return (
    priorYear * 365 +
    leapDays +
    DAYS_BEFORE_MONTH[date.month - 1] +
    currentYearLeapDay +
    date.day
  );
}

export function compareCivilDates(left: CivilDate, right: CivilDate): number {
  return civilDateToOrdinal(left) - civilDateToOrdinal(right);
}

export function differenceInCalendarDays(
  startDate: CivilDate,
  endDate: CivilDate,
): number {
  return civilDateToOrdinal(endDate) - civilDateToOrdinal(startDate);
}

export function subtractCalendarMonths(
  date: CivilDate,
  months: number,
): CivilDate {
  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError("Months must be a non-negative integer.");
  }

  const zeroBasedMonth = date.year * 12 + (date.month - 1) - months;
  const year = Math.floor(zeroBasedMonth / 12);
  const month = ((zeroBasedMonth % 12) + 12) % 12 + 1;

  if (year < 1) {
    throw new RangeError("Calculated date is outside the supported range.");
  }

  return {
    year,
    month,
    day: Math.min(date.day, getDaysInMonth(year, month)),
  };
}

export function previousCalendarDay(date: CivilDate): CivilDate {
  if (date.day > 1) {
    return { ...date, day: date.day - 1 };
  }

  if (date.month > 1) {
    const month = date.month - 1;
    return {
      year: date.year,
      month,
      day: getDaysInMonth(date.year, month),
    };
  }

  if (date.year === 1) {
    throw new RangeError("Calculated date is outside the supported range.");
  }

  return { year: date.year - 1, month: 12, day: 31 };
}

export function addCalendarYears(
  date: CivilDate,
  years: number,
): CivilDate {
  if (!Number.isInteger(years) || years < 0) {
    throw new RangeError("Years must be a non-negative integer.");
  }

  const year = date.year + years;

  if (year > 9999) {
    throw new RangeError("Calculated date is outside the supported range.");
  }

  return {
    year,
    month: date.month,
    day: Math.min(date.day, getDaysInMonth(year, date.month)),
  };
}

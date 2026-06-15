/**
 * Shared date utility functions for trading journal
 */

/**
 * Convert a date to YYYY-MM-DD format for localStorage/display
 */
export function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a numeric result with "R" suffix
 */
export function formatResultR(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded >= 0 ? "+" : ""}${text}R`;
}

/**
 * Get today's date in YYYY-MM-DD format for input[type="date"]
 */
export function getTodayInputValue(): string {
  const today = new Date();
  const offsetMs = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * Convert date input value to ISO string at noon UTC
 */
export function tradeDateToIso(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

/**
 * Format a date as DD-MMM (e.g., "15-Jun")
 */
export function formatWeekDate(date: Date): string {
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
    .toUpperCase();
}

/**
 * Format a date as DD-MMM-YY (e.g., "15-Jun-25")
 */
export function formatDateOnly(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

/**
 * Build weeks for a given year from trades
 */
export type TradingWeek = {
  monday: Date;
  friday: Date;
  key: string;
};

export function buildWeeksForYear(
  trades: { createdAt: string; tradeDate?: string }[],
  year: number
): TradingWeek[] {
  const weekMap = new Map<string, TradingWeek>();

  trades.forEach((trade) => {
    const date = getTradeDate(trade);

    if (date.getFullYear() !== year) {
      return;
    }

    const monday = new Date(date);
    monday.setHours(0, 0, 0, 0);

    const day = monday.getDay();
    monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const key = formatLocalDateKey(monday);

    if (!weekMap.has(key)) {
      weekMap.set(key, {
        monday,
        friday,
        key,
      });
    }
  });

  return Array.from(weekMap.values()).sort(
    (a, b) => b.monday.getTime() - a.monday.getTime()
  );
}

/**
 * Extract the actual trade date, preferring tradeDate over createdAt
 */
export function getTradeDate(trade: {
  createdAt: string;
  tradeDate?: string;
}): Date {
  const source = trade.tradeDate || trade.createdAt;
  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return new Date(trade.createdAt);
  }

  return date;
}

/**
 * Get the latest month for a year from trades
 */
export function getLatestMonthForYear(
  trades: { createdAt: string; tradeDate?: string }[],
  year: number
): number {
  const months = trades
    .filter((trade) => getTradeDate(trade).getFullYear() === year)
    .map((trade) => getTradeDate(trade).getMonth());

  return Math.max(...months, 0);
}

/**
 * Get the latest quarter for a year from trades
 */
export function getLatestQuarterForYear(
  trades: { createdAt: string; tradeDate?: string }[],
  year: number
): number {
  const quarters = trades
    .filter((trade) => getTradeDate(trade).getFullYear() === year)
    .map((trade) => Math.floor(getTradeDate(trade).getMonth() / 3) + 1);

  return Math.max(...quarters, 1);
}

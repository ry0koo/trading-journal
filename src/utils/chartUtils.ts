export type EquityPoint = {
  timestamp: number;
  dayKey: string;
  dateLabel: string;
  equity: number;
  tradesCount: number;
};

/** Builds the equity curve data from an ordered list of trades */
export function buildEquityCurve(
  trades: { result: number; createdAt: string; tradeDate?: string }[]
): EquityPoint[] {
  const formatDayKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  let sum = 0;
  const byDay = new Map<string, EquityPoint>();

  const sorted = [...trades].sort((a, b) => {
    const getT = (t: { createdAt: string; tradeDate?: string }) => {
      const src = t.tradeDate || t.createdAt;
      const d = new Date(src);
      return Number.isNaN(d.getTime()) ? new Date(t.createdAt).getTime() : d.getTime();
    };
    return getT(a) - getT(b);
  });

  sorted.forEach((trade) => {
    const src = trade.tradeDate || trade.createdAt;
    const date = new Date(src);
    if (Number.isNaN(date.getTime())) return;

    sum = Number((sum + Number(trade.result ?? 0)).toFixed(2));

    const dayKey = formatDayKey(date);
    const existing = byDay.get(dayKey);

    byDay.set(dayKey, {
      timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
      dayKey,
      dateLabel: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      equity: sum,
      tradesCount: (existing?.tradesCount ?? 0) + 1,
    });
  });

  return Array.from(byDay.values());
}

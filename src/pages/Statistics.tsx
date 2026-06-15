import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTrades } from "../hooks/useTrades";
import { PageWrapper } from "../components/PageWrapper";
import { BackButton } from "../components/BackButton";
import type { Period } from "../components/PeriodFilter";
import { EquityChart } from "../components/EquityChart";
import { buildEquityCurve } from "../utils/chartUtils";

import { headerStyle, titleStyle, widePageStyle } from "../ui";
import { formatLocalDateKey, formatResultR, getTradeDate, type TradingWeek } from "../utils/dateUtils";

import { StatisticsFilters } from "../components/StatisticsFilters";
import { StatCard } from "../components/StatCard";
import { SessionCard } from "../components/SessionCard";
import { Card } from "../components/PremiumUI";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function Statistics() {
  const navigate = useNavigate();
  const { trades } = useTrades();

  const [mode, setMode] = useState<Period>("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(0);

  // ── Derived filter options ──────────────────────────────────────────────
  const years = useMemo(() => {
    const set = new Set(trades.map((t) => getTradeDate(t).getFullYear()));
    const arr = [...set].sort((a, b) => b - a);
    return arr.length > 0 ? arr : [new Date().getFullYear()];
  }, [trades]);

  const yearsToShow = years;

  const availableMonths = useMemo(() => {
    const set = new Set(
      trades
        .filter((t) => getTradeDate(t).getFullYear() === selectedYear)
        .map((t) => getTradeDate(t).getMonth())
    );
    return [...set].sort((a, b) => a - b);
  }, [trades, selectedYear]);

  const availableQuarters = useMemo(() => {
    const set = new Set(
      trades
        .filter((t) => getTradeDate(t).getFullYear() === selectedYear)
        .map((t) => Math.floor(getTradeDate(t).getMonth() / 3) + 1)
    );
    return [...set].sort((a, b) => a - b);
  }, [trades, selectedYear]);

  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, TradingWeek>();
    trades.forEach((trade) => {
      const date = getTradeDate(trade);
      if (date.getFullYear() !== selectedYear) return;
      const monday = new Date(date);
      monday.setHours(0, 0, 0, 0);
      const day = monday.getDay();
      monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);
      const key = formatLocalDateKey(monday);
      if (!weekMap.has(key)) weekMap.set(key, { monday, friday, key });
    });
    return [...weekMap.values()].sort((a, b) => b.monday.getTime() - a.monday.getTime());
  }, [trades, selectedYear]);

  // keep selections valid
  const validatedQuarter = useMemo(() => {
    if (availableQuarters.length > 0 && !availableQuarters.includes(selectedQuarter)) {
      return availableQuarters[0];
    }
    return selectedQuarter;
  }, [availableQuarters, selectedQuarter]);

  const validatedMonth = useMemo(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      return availableMonths[0];
    }
    return selectedMonth;
  }, [availableMonths, selectedMonth]);

  // ── Filtered trades ─────────────────────────────────────────────────────
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const date = getTradeDate(trade);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (mode === "all") return true;
      if (mode === "year") return year === selectedYear;
      if (mode === "month") return year === selectedYear && month === validatedMonth;
      if (mode === "quarter") {
        return year === selectedYear && Math.floor(month / 3) + 1 === validatedQuarter;
      }
      if (mode === "week" && availableWeeks[selectedWeek]) {
        const week = availableWeeks[selectedWeek];
        const t = date.getTime();
        return t >= week.monday.getTime() && t <= week.friday.getTime();
      }
      return true;
    });
  }, [trades, mode, selectedYear, validatedMonth, validatedQuarter, selectedWeek, availableWeeks]);

  // ── Metrics ─────────────────────────────────────────────────────────────
  const wins = filteredTrades.filter((t) => t.result > 0);
  const losses = filteredTrades.filter((t) => t.result < 0);
  const totalTrades = filteredTrades.length;
  const totalResult = filteredTrades.reduce((s, t) => s + t.result, 0);
  const winRate = totalTrades === 0 ? 0 : Math.round((wins.length / totalTrades) * 100);

  const equityCurveData = useMemo(() => buildEquityCurve(filteredTrades), [filteredTrades]);

  const sessionStats = useMemo(() => {
    const map: Record<string, { wins: number; losses: number; total: number; result: number }> = {};
    filteredTrades.forEach((t) => {
      if (!t.session) return;
      const s = map[t.session] ?? { wins: 0, losses: 0, total: 0, result: 0 };
      s.total += 1;
      s.result += t.result;
      if (t.result > 0) s.wins += 1;
      else if (t.result < 0) s.losses += 1;
      map[t.session] = s;
    });
    return Object.entries(map)
      .map(([session, v]) => ({
        session,
        ...v,
        winrate: v.total ? (v.wins / v.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTrades]);

  const openHistory = (type: "trades" | "wins" | "losses") => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("type", type);
    if (mode !== "all") params.set("year", String(selectedYear));
    if (mode === "month") params.set("month", String(validatedMonth));
    if (mode === "quarter") params.set("quarter", String(validatedQuarter));
    if (mode === "week" && availableWeeks[selectedWeek]) {
      params.set("weekStart", availableWeeks[selectedWeek].key);
    }
    navigate(`/history?${params.toString()}`);
  };

  const handlePointClick = (point: { dayKey: string }) => {
    navigate(`/history?day=${point.dayKey}`);
  };

  const handleSessionClick = (session: string) => {
    navigate(`/history?session=${session}`);
  };

  const formatWeekLabel = (date: Date) =>
    date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();

  return (
    <PageWrapper style={{ ...widePageStyle, width: "100%", maxWidth: "800px" }}>
      <header style={{ ...headerStyle, marginBottom: "32px" }}>
        <BackButton />
        <h1 style={{ ...titleStyle, fontSize: "40px" }}>STATISTICS</h1>
      </header>

      <StatisticsFilters
        mode={mode}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedQuarter={selectedQuarter}
        selectedWeek={selectedWeek}
        yearsToShow={yearsToShow}
        availableMonths={availableMonths}
        availableQuarters={availableQuarters}
        availableWeeks={availableWeeks}
        MONTHS={MONTHS}
        setMode={setMode}
        setSelectedYear={setSelectedYear}
        setSelectedMonth={setSelectedMonth}
        setSelectedQuarter={setSelectedQuarter}
        setSelectedWeek={setSelectedWeek}
        formatWeekLabel={formatWeekLabel}
      />

      {/* Hero Stats */}
      <Card 
        style={{ marginBottom: "16px", padding: "40px 32px", textAlign: "center" }}
      >
        <div style={sectionLabelStyle}>TOTAL PERFORMANCE</div>
        <div
          style={{
            fontSize: "clamp(64px, 18vw, 92px)",
            fontWeight: 900,
            lineHeight: 0.85,
            color: totalResult >= 0 ? "var(--green)" : "var(--red)",
            letterSpacing: "-0.05em",
          }}
        >
          {totalTrades === 0 ? "—" : formatResultR(totalResult)}
        </div>
      </Card>

      {/* Equity Chart */}
      <div style={{ height: "320px", marginBottom: "16px" }}>
        <EquityChart
          data={equityCurveData}
          onPointClick={handlePointClick}
        />
      </div>

      {/* Stat Grid */}
      <div style={statsGridStyle}>
        <StatCard
          value={String(totalTrades)}
          label="TOTAL TRADES"
          onClick={() => openHistory("trades")}
        />
        <StatCard value={`${winRate}%`} label="WIN RATE" />
        <StatCard
          value={String(wins.length)}
          label="WINS"
          color="var(--green)"
          onClick={() => openHistory("wins")}
        />
        <StatCard
          value={String(losses.length)}
          label="LOSSES"
          color="var(--red)"
          onClick={() => openHistory("losses")}
        />
      </div>

      {/* Session Breakdown */}
      {sessionStats.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ ...sectionLabelStyle, marginBottom: "16px" }}>SESSION BREAKDOWN</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {sessionStats.map((s) => (
              <SessionCard 
                key={s.session} 
                {...s} 
                onClick={() => handleSessionClick(s.session)}
              />
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  color: "var(--muted)",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  marginBottom: "12px",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
};

export default Statistics;
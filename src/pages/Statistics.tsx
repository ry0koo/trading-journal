import { supabase } from "../lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Trade } from "../types/trade";

type Mode = "week" | "month" | "quarter" | "year" | "all";
type HistoryType = "trades" | "wins" | "losses";

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

type TradingWeek = {
  monday: Date;
  friday: Date;
  key: string;
};

type StatsTrade = Trade & {
  tradeDate?: string;
  session?: string;
};

function Statistics() {
  const navigate = useNavigate();
  useEffect(() => {
  loadTrades();

  const channel = supabase
    .channel("trades-home")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "trades",
      },
      () => {
        loadTrades();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

const loadTrades = async () => {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const formattedTrades: StatsTrade[] =
    data?.map((trade) => ({
      id: trade.id,
      instrument: trade.instrument,
      direction: trade.direction,
      result: trade.result,
      comment: trade.comment || "",

      beforeImage: trade.before_image,
      afterImage: trade.after_image,

      tradeDate: trade.trade_date,
      session: trade.session,

      createdAt: trade.created_at,
    })) || [];

  setTrades(formattedTrades);
};

  const [trades, setTrades] = useState<StatsTrade[]>([]);

  const years = useMemo(() => {
    const uniqueYears: number[] = [
      ...new Set(
        trades.map((trade) => getTradeDate(trade).getFullYear())
      ),
    ];

    return uniqueYears.sort((a, b) => b - a);
  }, [trades]);

  const yearsToShow =
    years.length > 0 ? years : [new Date().getFullYear()];
  const currentYear = yearsToShow[0];

  const [mode, setMode] = useState<Mode>("all");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(0);

  const availableMonths = useMemo(() => {
    const months: number[] = trades
      .filter((trade) => getTradeDate(trade).getFullYear() === selectedYear)
      .map((trade) => getTradeDate(trade).getMonth());

    return [...new Set(months)].sort((a, b) => a - b);
  }, [trades, selectedYear]);

  const availableQuarters = useMemo(() => {
    const quarters: number[] = trades
      .filter((trade) => getTradeDate(trade).getFullYear() === selectedYear)
      .map((trade) => Math.floor(getTradeDate(trade).getMonth() / 3) + 1);

    return [...new Set(quarters)].sort((a, b) => a - b);
  }, [trades, selectedYear]);

  const availableWeeks = useMemo(() => {
    const weekMap = new Map<string, TradingWeek>();

    trades.forEach((trade) => {
      const date = getTradeDate(trade);

      if (date.getFullYear() !== selectedYear) {
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
  }, [trades, selectedYear]);

  useEffect(() => {
    if (mode === "month") {
      setSelectedMonth(availableMonths[0] ?? 0);
    }
  }, [mode, selectedYear, availableMonths]);

  useEffect(() => {
    if (mode === "quarter") {
      setSelectedQuarter(availableQuarters[0] ?? 1);
    }
  }, [mode, selectedYear, availableQuarters]);

  useEffect(() => {
    if (mode === "week") {
      setSelectedWeek(0);
    }
  }, [mode, selectedYear]);

  const filteredTrades = trades.filter((trade) => {
    const date = getTradeDate(trade);
    const year = date.getFullYear();
    const month = date.getMonth();

    if (mode === "all") {
      return true;
    }

    if (mode === "year") {
      return year === selectedYear;
    }

    if (mode === "month") {
      return year === selectedYear && month === selectedMonth;
    }

    if (mode === "quarter") {
      const quarter = Math.floor(month / 3) + 1;
      return year === selectedYear && quarter === selectedQuarter;
    }

    if (mode === "week" && availableWeeks[selectedWeek]) {
      const week = availableWeeks[selectedWeek];
      const time = date.getTime();

      return time >= week.monday.getTime() && time <= week.friday.getTime();
    }

    return true;
  });

  const totalTrades = filteredTrades.length;

  const wins = filteredTrades.filter((trade) => trade.result > 0);
  const losses = filteredTrades.filter((trade) => trade.result < 0);

  const totalResult = filteredTrades.reduce(
    (sum, trade) => sum + trade.result,
    0
  );

  const winRate =
    totalTrades === 0 ? 0 : Math.round((wins.length / totalTrades) * 100);

  const openHistory = (type: HistoryType) => {
    const params = new URLSearchParams();

    params.set("mode", mode);
    params.set("type", type);

    if (mode === "year") {
      params.set("year", String(selectedYear));
    }

    if (mode === "month") {
      params.set("year", String(selectedYear));
      params.set("month", String(selectedMonth));
    }

    if (mode === "quarter") {
      params.set("year", String(selectedYear));
      params.set("quarter", String(selectedQuarter));
    }

    if (mode === "week") {
      const week = availableWeeks[selectedWeek];

      if (week) {
        params.set("year", String(selectedYear));
        params.set("weekStart", week.key);
      } else {
        params.set("year", String(selectedYear));
      }
    }

    navigate(`/history?${params.toString()}`);
  };

  const formatWeekDate = (date: Date) =>
    date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
      .toUpperCase();

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        color: "#fff",
        padding: "40px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    ><button
  onClick={() => navigate("/")}
  style={{
    background: "#111",
    border: "1px solid #222",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    marginBottom: "24px",
    fontWeight: 700,
  }}
>
  ← HOME
</button>
      <h1
        style={{
          fontSize: "72px",
          marginBottom: "30px",
        }}
      >
        STATISTICS
      </h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <PeriodButton active={mode === "week"} onClick={() => setMode("week")}>
          WEEK
        </PeriodButton>

        <PeriodButton active={mode === "month"} onClick={() => setMode("month")}>
          MONTH
        </PeriodButton>

        <PeriodButton
          active={mode === "quarter"}
          onClick={() => setMode("quarter")}
        >
          QUARTER
        </PeriodButton>

        <PeriodButton active={mode === "year"} onClick={() => setMode("year")}>
          YEAR
        </PeriodButton>

        <PeriodButton active={mode === "all"} onClick={() => setMode("all")}>
          LIFETIME
        </PeriodButton>
      </div>

      {mode !== "all" && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={selectStyle}
          >
            {yearsToShow.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {mode === "month" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={selectStyle}
            >
              {availableMonths.length === 0 ? (
                <option value={0}>NO MONTHS FOUND</option>
              ) : (
                availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {MONTHS[month]} {selectedYear}
                  </option>
                ))
              )}
            </select>
          )}

          {mode === "quarter" && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              style={selectStyle}
            >
              {availableQuarters.length === 0 ? (
                <option value={1}>NO QUARTERS FOUND</option>
              ) : (
                availableQuarters.map((quarter) => (
                  <option key={quarter} value={quarter}>
                    Q{quarter} {selectedYear}
                  </option>
                ))
              )}
            </select>
          )}

          {mode === "week" && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              style={selectStyle}
            >
              {availableWeeks.length === 0 ? (
                <option value={0}>NO WEEKS FOUND</option>
              ) : (
                availableWeeks.map((week, index) => (
                  <option key={index} value={index}>
                    {formatWeekDate(week.monday)} - {formatWeekDate(week.friday)}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <StatCard
          value={formatResultR(totalResult)}
          label="TOTAL R"
          big
          color={
            totalResult > 0 ? "#4ade80" : totalResult < 0 ? "#ef4444" : "#fff"
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "16px",
        }}
      >
        <StatCard
          value={String(totalTrades)}
          label="TRADES"
          onClick={() => openHistory("trades")}
        />

        <StatCard value={`${winRate}%`} label="WIN RATE" />

        <StatCard
          value={String(wins.length)}
          label="WINS"
          color="#4ade80"
          onClick={() => openHistory("wins")}
        />

        <StatCard
          value={String(losses.length)}
          label="LOSSES"
          color="#ef4444"
          onClick={() => openHistory("losses")}
        />
      </div>
    </div>
  );
}

function getTradeDate(trade: StatsTrade) {
  const source = trade.tradeDate || trade.createdAt;
  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return new Date(trade.createdAt);
  }

  return date;
}

function formatResultR(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded >= 0 ? "+" : ""}${text}R`;
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PeriodButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: "14px 22px",
        background: active ? "#fff" : "#111",
        color: active ? "#000" : "#fff",
        border: "1px solid #222",
        borderRadius: "14px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function StatCard({
  value,
  label,
  big = false,
  color = "#fff",
  onClick,
}: {
  value: string;
  label: string;
  big?: boolean;
  color?: string;
  onClick?: () => void;
}) {
  const content = (
    <div
      style={{
        background: "#111",
        border: "1px solid #222",
        borderRadius: "24px",
        padding: "28px",
        transition: "transform 0.15s ease, border-color 0.15s ease",
        transform: onClick ? "translateY(0)" : "none",
      }}
    >
      <div
        style={{
          fontSize: big ? "52px" : "42px",
          fontWeight: 900,
          marginBottom: "10px",
          color,
        }}
      >
        {value}
      </div>

      <div
        style={{
          opacity: 0.6,
          letterSpacing: "1px",
        }}
      >
        {label}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const card = e.currentTarget.querySelector(
            "div"
          ) as HTMLDivElement | null;
          if (card) {
            card.style.borderColor = "#555";
          }
        }}
        onMouseLeave={(e) => {
          const card = e.currentTarget.querySelector(
            "div"
          ) as HTMLDivElement | null;
          if (card) {
            card.style.borderColor = "#222";
          }
        }}
      >
        {content}
      </button>
    );
  }

  return content;
}

const selectStyle = {
  background: "#111",
  color: "#fff",
  border: "1px solid #222",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
};

export default Statistics;
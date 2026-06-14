import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";
import {
  activeSegmentStyle,
  colors,
  headerStyle,
  quietButtonStyle,
  resultColor,
  sectionStyle,
  segmentStyle,
  selectStyle,
  titleStyle,
  widePageStyle,
} from "../ui";

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
  const [trades, setTrades] = useState<StatsTrade[]>(() => {
  const cached = localStorage.getItem("stats_cache");
  return cached ? JSON.parse(cached) : [];
});
  const [mode, setMode] = useState<Mode>("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(0);

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
      result: Number(trade.result),
      comment: trade.comment || "",
      beforeImage: trade.before_image,
      afterImage: trade.after_image,
      tradeDate: trade.trade_date,
      session: trade.session,
      createdAt: trade.created_at,
    })) || [];

  setTrades(formattedTrades);

  localStorage.setItem("stats_cache", JSON.stringify(formattedTrades));
};

    useEffect(() => {
  // 1. моментально показываем кеш
  const cached = localStorage.getItem("stats_cache");

  if (cached) {
    try {
      setTrades(JSON.parse(cached));
    } catch (e) {
      console.error("cache error", e);
    }
  }

  // 2. загружаем свежие данные
  loadTrades();

  // 3. realtime
  const channel = supabase
    .channel("trades-statistics")
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

  const years = useMemo(() => {
    const uniqueYears: number[] = [
      ...new Set(trades.map((trade) => getTradeDate(trade).getFullYear())),
    ];

    return uniqueYears.sort((a, b) => b - a);
  }, [trades]);

  const yearsToShow = years.length > 0 ? years : [selectedYear];

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

  useEffect(() => {
  if (availableQuarters.length === 0) return;

  if (!availableQuarters.includes(selectedQuarter)) {
    setSelectedQuarter(availableQuarters[0]);
  }
}, [availableQuarters]);

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
  const equityCurveData = useMemo(() => {
  let sum = 0;

  return filteredTrades
    .slice()
    .sort((a, b) => getTradeDate(a).getTime() - getTradeDate(b).getTime())
    .map((t) => {
  const date = getTradeDate(t);

  const safeDate = date;

  const label = Number.isNaN(safeDate.getTime())
    ? "Invalid"
    : safeDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });

  sum += Number(t.result ?? 0);

  return {
  timestamp: safeDate.getTime(),
  dateLabel: label,
  equity: Number(sum.toFixed(2)),
};
})
    .filter(Boolean);
}, [filteredTrades]);
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
    <main style={widePageStyle}>
      <header style={headerStyle}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={quietButtonStyle}
        >
          BACK
        </button>
        <h1 style={titleStyle}>STATISTICS</h1>
      </header>

      <section style={{ ...sectionStyle, marginBottom: "14px" }}>
        <div style={periodGridStyle}>
          <PeriodButton active={mode === "week"} onClick={() => setMode("week")}>
            WEEK
          </PeriodButton>
          <PeriodButton
            active={mode === "month"}
            onClick={() => setMode("month")}
          >
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
            ALL
          </PeriodButton>
        </div>

        {mode !== "all" && (
          <div style={filterGridStyle}>
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
                  <option value={0}>NO MONTHS</option>
                ) : (
                  availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {MONTHS[month]}
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
                  <option value={1}>NO QUARTERS</option>
                ) : (
                  availableQuarters.map((quarter) => (
                    <option key={quarter} value={quarter}>
                      Q{quarter}
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
                  <option value={0}>NO WEEKS</option>
                ) : (
                  availableWeeks.map((week, index) => (
                    <option key={week.key} value={index}>
                      {formatWeekDate(week.monday)} -{" "}
                      {formatWeekDate(week.friday)}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        )}
      </section>

      <section
        style={{
          ...sectionStyle,
          marginBottom: "14px",
          padding: "28px 22px",
        }}
      >
        <div
          style={{
            color: colors.muted,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: "14px",
          }}
        >
          TOTAL RESULT
        </div>
        <div
          style={{
            fontSize: "68px",
            fontWeight: 900,
            lineHeight: 0.95,
            color: resultColor(totalResult),
          }}
        >
          {formatResultR(totalResult)}
        </div>
      </section>
      <section style={{ ...sectionStyle, marginBottom: "14px" }}>

  <div
    style={{
      color: colors.muted,
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: "0.08em",
      marginBottom: "14px",
    }}
  >
    EQUITY CURVE
  </div>

  <div
  style={{
    width: "100%",
    height: "520px",
    overflow: "hidden",
    borderRadius: "18px",
  }}
>
  <EquityChart data={equityCurveData} />
</div>
</section>

      <section style={statsGridStyle}>
        <StatCard
          value={String(totalTrades)}
          label="TRADES"
          onClick={() => openHistory("trades")}
        />
        <StatCard value={`${winRate}%`} label="WIN RATE" />
        <StatCard
          value={String(wins.length)}
          label="WINS"
          color={colors.green}
          onClick={() => openHistory("wins")}
        />
        <StatCard
          value={String(losses.length)}
          label="LOSSES"
          color={colors.red}
          onClick={() => openHistory("losses")}
        />
      </section>
    </main>
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
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={active ? activeSegmentStyle : segmentStyle}
    >
      {children}
    </button>
  );
}

function StatCard({
  value,
  label,
  color = colors.text,
  onClick,
}: {
  value: string;
  label: string;
  color?: string;
  onClick?: () => void;
}) {
  const content = (
    <div
      style={{
        ...sectionStyle,
        minHeight: "118px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: "38px",
          fontWeight: 900,
          lineHeight: 1,
          color,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: colors.muted,
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </div>
  );

  if (!onClick) {
    return content;
  }

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
    >
      {content}
    </button>
  );
}

const periodGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px",
};

const filterGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};
function EquityChart({
  data,
}: {
  data: {
    timestamp: number;
    dateLabel: string;
    equity: number;
  }[];
}) {

  return (
    <div
  style={{
    width: "100%",
    height: "100%",
    borderRadius: "18px",
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    overflow: "hidden",
    display: "flex",
    padding: "0px",
  }}
>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
  data={data}
  margin={{
    top: 10,
    right: 0,
    left: 0,
    bottom: 0,
  }}
>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#1a1a1a"
            vertical={false}
          />

          <XAxis
  dataKey="timestamp"
  type="number"
  domain={["dataMin", "dataMax"]}
  tickFormatter={(value) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
  }
  tick={{ fill: "#666", fontSize: 12 }}
/>

          <YAxis
  width={25}
  stroke="#666"
  tick={{ fill: "#666", fontSize: 12 }}
/>

          <Tooltip
  formatter={(value: any) => {
    const num = typeof value === "number" ? value : Number(value ?? 0);

    return [`${num.toFixed(2)} R`, "Equity"];
  }}
  labelFormatter={(label) =>
  new Date(Number(label)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })
}
  contentStyle={{
    background: "#111",
    border: "1px solid #222",
    borderRadius: "12px",
    color: "#fff",
  }}
/>

          <Area
            type="linear"
            dataKey="equity"
            stroke="#4ade80"
            strokeWidth={1.5}
            fill="url(#equityFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export default Statistics;
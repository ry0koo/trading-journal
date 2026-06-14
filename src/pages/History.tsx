import { supabase } from "../lib/supabase";
import { colors } from "../ui";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import type { Trade } from "../types/trade";
import {
  activeSegmentStyle,
  headerStyle,
  quietButtonStyle,
  sectionStyle,
  segmentStyle,
  selectStyle,
  titleStyle,
  widePageStyle,
} from "../ui";

type Period = "week" | "month" | "quarter" | "year" | "all";
type TradeType = "trades" | "wins" | "losses";

type TradingWeek = {
  monday: Date;
  friday: Date;
  key: string;
};

type HistoryTrade = Trade & {
  tradeDate?: string;
  session?: string;
};

type TradeRow = {
  id: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  result: number | string;
  comment?: string | null;
  before_image?: string | null;
  after_image?: string | null;
  trade_date?: string | null;
  session?: string | null;
  created_at: string;
};

type PreviewImage = {
  src: string;
  title: string;
};

function History() {
  const [trades, setTrades] = useState<HistoryTrade[]>([]);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

async function loadTrades() {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const formattedTrades: HistoryTrade[] =
    ((data || []) as TradeRow[]).map((trade) => ({
      id: trade.id,
      instrument: trade.instrument,
      direction: trade.direction,
      result: Number(trade.result),
      comment: trade.comment || "",
      beforeImage: trade.before_image || "",
      afterImage: trade.after_image || "",
      tradeDate: trade.trade_date || "",
      session: trade.session || "",
      createdAt: trade.created_at,
    }));

  setTrades(formattedTrades);
}

useEffect(() => {
  void Promise.resolve().then(loadTrades);

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

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);

  const years = useMemo(() => {
    const uniqueYears: number[] = [
      ...new Set(trades.map((trade) => getTradeDate(trade).getFullYear())),
    ];

    return uniqueYears.sort((a, b) => b - a);
  }, [trades]);

  const currentYear = years[0] ?? new Date().getFullYear();
  const activeMode = (searchParams.get("mode") as Period) ?? "all";
  const activeType = (searchParams.get("type") as TradeType) ?? "trades";

  const activeYear = Number(searchParams.get("year")) || currentYear;
  const activeMonth = Number(searchParams.get("month"));
  const activeQuarter = Number(searchParams.get("quarter"));
  const activeWeekStart = searchParams.get("weekStart");

  const weeksForActiveYear = useMemo(
    () => buildWeeksForYear(trades, activeYear),
    [trades, activeYear]
  );
const availableMonths = useMemo(() => {
  const months = trades
    .filter(
      (trade) =>
        getTradeDate(trade).getFullYear() === activeYear
    )
    .map((trade) => getTradeDate(trade).getMonth());

  return [...new Set(months)].sort((a, b) => a - b);
}, [trades, activeYear]);

const availableQuarters = useMemo(() => {
  const quarters = trades
    .filter(
      (trade) =>
        getTradeDate(trade).getFullYear() === activeYear
    )
    .map(
      (trade) =>
        Math.floor(
          getTradeDate(trade).getMonth() / 3
        ) + 1
    );

  return [...new Set(quarters)].sort(
    (a, b) => a - b
  );
}, [trades, activeYear]);

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
  const deleteTrade = async (id: string) => {
  await supabase
    .from("trades")
    .delete()
    .eq("id", id);

  setTrades(
    trades.filter((trade) => trade.id !== id)
  );

  if (selectedTradeId === id) {
    setSelectedTradeId(null);
  }
};

  const filteredTrades = useMemo(() => {
    let result = [...trades];

    if (activeType === "wins") {
      result = result.filter((trade) => trade.result > 0);
    } else if (activeType === "losses") {
      result = result.filter((trade) => trade.result < 0);
    }

    if (activeMode === "all") {
      return result.sort(sortTradesDesc);
    }

    if (activeMode === "year") {
      result = result.filter((trade) => getTradeDate(trade).getFullYear() === activeYear);
      return result.sort(sortTradesDesc);
    }

    if (activeMode === "month") {
      const monthValue = Number.isNaN(activeMonth)
        ? new Date().getMonth()
        : activeMonth;

      result = result.filter((trade) => {
        const date = getTradeDate(trade);
        return date.getFullYear() === activeYear && date.getMonth() === monthValue;
      });

      return result.sort(sortTradesDesc);
    }

    if (activeMode === "quarter") {
      const quarterValue = Number.isNaN(activeQuarter) ? 1 : activeQuarter;

      result = result.filter((trade) => {
        const date = getTradeDate(trade);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return date.getFullYear() === activeYear && quarter === quarterValue;
      });

      return result.sort(sortTradesDesc);
    }

    if (activeMode === "week") {
      const fallbackWeek = weeksForActiveYear[0];
      const weekStartKey = activeWeekStart || fallbackWeek?.key;

      if (!weekStartKey) {
        return [];
      }

      const weekStart = parseLocalDateKey(weekStartKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);

      result = result.filter((trade) => {
        const tradeDate = getTradeDate(trade);
        const time = tradeDate.getTime();

        return time >= weekStart.getTime() && time <= weekEnd.getTime();
      });

      return result.sort(sortTradesDesc);
    }

    return result.sort(sortTradesDesc);
  }, [
    trades,
    activeMode,
    activeType,
    activeYear,
    activeMonth,
    activeQuarter,
    activeWeekStart,
    weeksForActiveYear,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTradeId(null);
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectedTrade =
    selectedTradeId
      ? filteredTrades.find((trade) => trade.id === selectedTradeId) ?? null
      : null;

  const buildSearchParamsForMode = (mode: Period) => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("type", activeType);

    const latestYear = years[0] ?? currentYear;

    if (mode === "year") {
      params.set("year", String(latestYear));
      return params;
    }

    if (mode === "month") {
      const year = latestYear;
      const month = getLatestMonthForYear(trades, year);
      params.set("year", String(year));
      params.set("month", String(month));
      return params;
    }

    if (mode === "quarter") {
      const year = latestYear;
      const quarter = getLatestQuarterForYear(trades, year);
      params.set("year", String(year));
      params.set("quarter", String(quarter));
      return params;
    }

    if (mode === "week") {
      const year = latestYear;
      const weeks = buildWeeksForYear(trades, year);
      const week = weeks[0];

      params.set("year", String(year));

      if (week) {
        params.set("weekStart", week.key);
      }

      return params;
    }

    return params;
  };

  const handleModeClick = (mode: Period) => {
    setSearchParams(buildSearchParamsForMode(mode));
  };

  const countLabel =
    activeType === "wins"
      ? "WINS"
      : activeType === "losses"
      ? "LOSSES"
      : "TRADES";

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

      <h1 style={titleStyle}>HISTORY</h1>
    </header>

    <section style={{ ...sectionStyle, marginBottom: "14px" }}>
      <div style={periodGridStyle}>
        <PeriodButton
          active={activeMode === "week"}
          onClick={() => handleModeClick("week")}
        >
          WEEK
        </PeriodButton>

        <PeriodButton
          active={activeMode === "month"}
          onClick={() => handleModeClick("month")}
        >
          MONTH
        </PeriodButton>

        <PeriodButton
          active={activeMode === "quarter"}
          onClick={() => handleModeClick("quarter")}
        >
          QUARTER
        </PeriodButton>

        <PeriodButton
          active={activeMode === "year"}
          onClick={() => handleModeClick("year")}
        >
          YEAR
        </PeriodButton>

        <PeriodButton
          active={activeMode === "all"}
          onClick={() => handleModeClick("all")}
        >
          ALL
        </PeriodButton>
      </div>

      {activeMode !== "all" && (
        <div style={filterGridStyle}>
          <select
            value={activeYear}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              params.set("year", e.target.value);
              setSearchParams(params);
            }}
            style={selectStyle}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {activeMode === "month" && (
            <select
              value={activeMonth}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set("month", e.target.value);
                setSearchParams(params);
              }}
              style={selectStyle}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {MONTHS[month]}
                </option>
              ))}
            </select>
          )}

          {activeMode === "quarter" && (
            <select
              value={activeQuarter}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set("quarter", e.target.value);
                setSearchParams(params);
              }}
              style={selectStyle}
            >
              {availableQuarters.map((quarter) => (
                <option key={quarter} value={quarter}>
                  Q{quarter}
                </option>
              ))}
            </select>
          )}

          {activeMode === "week" && (
            <select
              value={activeWeekStart ?? ""}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set("weekStart", e.target.value);
                setSearchParams(params);
              }}
              style={selectStyle}
            >
              {weeksForActiveYear.map((week) => (
                <option key={week.key} value={week.key}>
                  {formatWeekLabel(week)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </section>

    <div
      style={{
        opacity: 0.6,
        marginBottom: "20px",
        fontSize: "18px",
        fontWeight: 600,
        letterSpacing: 0,
      }}
    >
      {filteredTrades.length} {countLabel}
    </div>

      {filteredTrades.length === 0 && (
        <div
          style={{
            opacity: 0.5,
            textAlign: "center",
            marginTop: "80px",
          }}
        >
          No trades found
        </div>
      )}

      {filteredTrades.length > 0 && (
        <div
          style={{
            border: "1px solid #222",
            borderRadius: "20px",
            overflow: "hidden",
            background: "#0b0b0b",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "100%" }}>
              <div
  style={{
    display: "grid",
    gridTemplateColumns: "1.8fr 0.9fr 0.9fr 1.1fr 20px",
    gap: "16px",
    whiteSpace: "nowrap",
    padding: "14px 16px",
    color: "#8a8a8a",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    borderBottom: "1px solid #1f1f1f",
  }}
>
                <div>Symbol</div>
                <div>Type</div>
                <div>Result</div>
                <div>Date</div>
                <div />
              </div>

              {filteredTrades.map((trade) => {
                const tradeDate = getTradeDate(trade);
                const isSelected = selectedTradeId === trade.id;

                return (
                  <button
                    key={trade.id}
                    type="button"
                    onClick={() => setSelectedTradeId(trade.id)}
                    style={{
                      width: "100%",
                      display: "grid",
                      whiteSpace: "nowrap",
                      gridTemplateColumns: "1.8fr 0.9fr 0.9fr 1.1fr 20px",
                      gap: "16px",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: isSelected ? "#151515" : "#0f0f0f",
                      border: "none",
                      borderBottom: "1px solid #1f1f1f",
                      color: "#fff",
                      textAlign: "left" as CSSProperties["textAlign"],
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
  fontSize: "18px",
  fontWeight: 700,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}}
                    >
                      {trade.instrument}
                    </div>

                    <div
                      style={{
                        color: trade.direction === "LONG" ? "#4ade80" : "#ef4444",
                        fontWeight: 700,
                      }}
                    >
                      {trade.direction}
                    </div>

                    <div
                      style={{
                        color: trade.result >= 0 ? "#4ade80" : "#ef4444",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatResultR(trade.result)}
                    </div>

                    <div style={{ color: "#d7d7d7" }}>
                      {formatDateOnly(tradeDate)}
                    </div>

                    <div
                      style={{
                        color: "#8a8a8a",
                        fontSize: "18px",
                        textAlign: "right",
                      }}
                    >
                      {">"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedTrade && (
        <div
          style={{
            marginTop: "24px",
            background: "#111",
            border: "1px solid #222",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
  style={{
    position: "relative",
    marginBottom: "20px",
  }}
>
            <div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {selectedTrade.instrument}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span style={pillStyle}>{selectedTrade.direction}</span>

                {selectedTrade.session && (
                  <span style={pillStyle}>{selectedTrade.session}</span>
                )}

                <span style={pillStyle}>
                  {formatDateOnly(getTradeDate(selectedTrade))}
                </span>

                <span
                  style={{
                    ...pillStyle,
                    color: selectedTrade.result >= 0 ? "#4ade80" : "#ef4444",
                    borderColor:
                      selectedTrade.result >= 0 ? "#21482f" : "#4a1e1e",
                  }}
                >
                  {formatResultR(selectedTrade.result)}
                </span>
              </div>

             {selectedTrade.comment && (
  <div style={{ marginTop: "14px", maxWidth: "700px" }}>
    
    <div
      style={{
        fontSize: "11px",
        color: "#777",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "6px",
      }}
    >
      COMMENT
    </div>

    <div
      style={{
        opacity: 0.92,
        lineHeight: 1.6,
        color: "#fff",
      }}
    >
      {selectedTrade.comment}
    </div>

  </div>
)}
            </div>

            <div
  style={{
    position: "absolute",
    top: 0,
    right: 0,
    display: "flex",
    gap: "10px",
    alignItems: "center",
  }}
>
  <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setShowMenuId(
      showMenuId === selectedTrade.id
        ? null
        : selectedTrade.id
    );
  }}
  style={actionIconButtonStyle}
>
  ⋯
</button>
{showMenuId === selectedTrade.id && (
  <div
    style={{
      position: "absolute",
      top: "40px",
      right: "0px",
      background: "#111",
      border: "1px solid #333",
      borderRadius: "12px",
      overflow: "hidden",
      zIndex: 50,
      minWidth: "120px",
    }}
  >
    <button
      style={menuItemStyle}
      onClick={() => {
        navigate(`/new-trade?edit=${selectedTrade.id}`);
      }}
    >
      EDIT
    </button>

    <button
      style={menuItemStyle}
      onClick={() => deleteTrade(selectedTrade.id)}
    >
      DELETE
    </button>
  </div>
)}

  <button
    type="button"
    onClick={() => setSelectedTradeId(null)}
    style={actionIconButtonStyle}
  >
    X
  </button>
</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
gap: "16px",
            }}
          >
            <ImageBlock
              title="BEFORE"
              image={selectedTrade.beforeImage}
              onClick={() =>
                selectedTrade.beforeImage &&
                setPreviewImage({
                  src: selectedTrade.beforeImage,
                  title: "Before screenshot",
                })
              }
            />

            <ImageBlock
              title="AFTER"
              image={selectedTrade.afterImage}
              onClick={() =>
                selectedTrade.afterImage &&
                setPreviewImage({
                  src: selectedTrade.afterImage,
                  title: "After screenshot",
                })
              }
            />
          </div>
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "96vw",
              maxHeight: "96vh",
              position: "relative",
            }}
          >
            <button
  type="button"
  onClick={() => setPreviewImage(null)}
  style={{
    position: "absolute",
    top: "-44px",
    right: 0,
    background: "transparent",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "999px",
    width: "34px",
    height: "34px",
    cursor: "pointer",
    lineHeight: 1,
  }}
>
  X
</button>

            <img
              src={previewImage.src}
              alt={previewImage.title}
              style={{
                display: "block",
                maxWidth: "96vw",
                maxHeight: "92vh",
                objectFit: "contain",
                borderRadius: "18px",
                boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
  }

function getTradeDate(trade: HistoryTrade) {
  const source = trade.tradeDate || trade.createdAt;
  const date = new Date(source);

  if (Number.isNaN(date.getTime())) {
    return new Date(trade.createdAt);
  }

  return date;
}

function buildWeeksForYear(trades: HistoryTrade[], year: number): TradingWeek[] {
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

function getLatestMonthForYear(trades: HistoryTrade[], year: number) {
  const months = trades
    .filter((trade) => getTradeDate(trade).getFullYear() === year)
    .map((trade) => getTradeDate(trade).getMonth());

  if (months.length === 0) {
    return new Date().getMonth();
  }

  return Math.max(...months);
}

function getLatestQuarterForYear(trades: HistoryTrade[], year: number) {
  const quarters = trades
    .filter((trade) => getTradeDate(trade).getFullYear() === year)
    .map((trade) => Math.floor(getTradeDate(trade).getMonth() / 3) + 1);

  if (quarters.length === 0) {
    return Math.floor(new Date().getMonth() / 3) + 1;
  }

  return Math.max(...quarters);
}

function sortTradesDesc(a: HistoryTrade, b: HistoryTrade) {
  return getTradeDate(b).getTime() - getTradeDate(a).getTime();
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatResultR(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded >= 0 ? "+" : ""}${text}R`;
}

function formatDateOnly(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
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

function ImageBlock({
  title,
  image,
  onClick,
}: {
  title: string;
  image?: string;
  onClick?: () => void;
}) {
  return (
    <div
      style={{
        background: "#0c0c0c",
        border: "1px solid #222",
        borderRadius: "18px",
        padding: "14px",
      }}
    >
      <div
        style={{
          marginBottom: "10px",
          opacity: 0.7,
          fontSize: "13px",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </div>

      {image ? (
        <button
          type="button"
          onClick={onClick}
          style={{
            width: "100%",
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: onClick ? "zoom-in" : "default",
          }}
        >
          <img
            src={image}
            alt=""
            style={{
              width: "100%",
              height: "220px",
              display: "block",
              borderRadius: "14px",
              objectFit: "cover",
            }}
          />
        </button>
      ) : (
        <div
          style={{
            minHeight: "220px",
            borderRadius: "14px",
            border: "1px dashed #2c2c2c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No screenshot
        </div>
      )}
    </div>
  );
}

const pillStyle = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  fontSize: "12px",
  opacity: 0.9,
};
function formatWeekLabel(
  week: TradingWeek
) {
  const start =
    week.monday.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
      }
    );

  const end =
    week.friday.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
      }
    );

  return `${start.toUpperCase()} - ${end.toUpperCase()}`;
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
const menuItemStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#111",
  border: "1px solid #333",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
};
const actionIconButtonStyle: CSSProperties = {
  width: "40px",
  height: "40px",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: "12px",

  color: colors.text,

  fontSize: "18px",
  fontWeight: 900,
  lineHeight: 1,

  cursor: "pointer",
};

export default History;

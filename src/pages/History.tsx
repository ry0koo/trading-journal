import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import { useTrades } from "../hooks/useTrades";
import { BackButton } from "../components/BackButton";
import { PageWrapper } from "../components/PageWrapper";
import type { Period } from "../components/PeriodFilter";

import { headerStyle, titleStyle, widePageStyle } from "../ui";
import {
  getTradeDate,
  formatLocalDateKey,
  buildWeeksForYear,
  getLatestMonthForYear,
  getLatestQuarterForYear,
} from "../utils/dateUtils";
import type { Trade } from "../types/trade";

import { HistoryFilters } from "../components/HistoryFilters";
import { TradeList } from "../components/TradeList";
import { TradeDetail } from "../components/TradeDetail";
import { Lightbox } from "../components/Lightbox";
import { Button } from "../components/PremiumUI";

type TradeType = "trades" | "wins" | "losses";
type PreviewImage = { src: string; title: string };

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function History() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { trades, loading } = useTrades();

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [highlightedTradeId, setHighlightedTradeId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);

  const tradeDetailsRef = useRef<HTMLDivElement | null>(null);
  const listScrollRef = useRef<number>(0);

  // ── URL params ───────────────────────────────────────────────────────────
  const activeMode = (searchParams.get("mode") as Period) ?? "all";
  const activeType = (searchParams.get("type") as TradeType) ?? "trades";
  const activeYear = Number(searchParams.get("year")) || new Date().getFullYear();
  const activeMonth = Number(searchParams.get("month"));
  const activeQuarter = Number(searchParams.get("quarter"));
  const activeWeekStart = searchParams.get("weekStart");
  const activeDay = searchParams.get("day");

  const activeDayLabel = activeDay
    ? new Date(activeDay)
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase()
    : null;

  // ── Derived data ─────────────────────────────────────────────────────────
  const years = useMemo(() => {
    const set = new Set(trades.map((t) => getTradeDate(t).getFullYear()));
    const arr = [...set].sort((a, b) => b - a);
    return arr.length > 0 ? arr : [new Date().getFullYear()];
  }, [trades]);

  const weeksForActiveYear = useMemo(
    () => buildWeeksForYear(trades, activeYear),
    [trades, activeYear]
  );

  const availableMonths = useMemo(() => {
    const set = new Set(
      trades
        .filter((t) => getTradeDate(t).getFullYear() === activeYear)
        .map((t) => getTradeDate(t).getMonth())
    );
    return [...set].sort((a, b) => a - b);
  }, [trades, activeYear]);

  const availableQuarters = useMemo(() => {
    const set = new Set(
      trades
        .filter((t) => getTradeDate(t).getFullYear() === activeYear)
        .map((t) => Math.floor(getTradeDate(t).getMonth() / 3) + 1)
    );
    return [...set].sort((a, b) => a - b);
  }, [trades, activeYear]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    if (activeDay) {
      return result
        .filter((t) => formatLocalDateKey(getTradeDate(t)) === activeDay)
        .sort(sortDesc);
    }

    if (activeType === "wins") result = result.filter((t) => t.result > 0);
    else if (activeType === "losses") result = result.filter((t) => t.result < 0);

    if (activeMode === "all") return result.sort(sortDesc);

    if (activeMode === "year") {
      return result.filter((t) => getTradeDate(t).getFullYear() === activeYear).sort(sortDesc);
    }

    if (activeMode === "month") {
      const m = Number.isNaN(activeMonth) ? new Date().getMonth() : activeMonth;
      return result
        .filter((t) => {
          const d = getTradeDate(t);
          return d.getFullYear() === activeYear && d.getMonth() === m;
        })
        .sort(sortDesc);
    }

    if (activeMode === "quarter") {
      const q = Number.isNaN(activeQuarter) ? 1 : activeQuarter;
      return result
        .filter((t) => {
          const d = getTradeDate(t);
          return d.getFullYear() === activeYear && Math.floor(d.getMonth() / 3) + 1 === q;
        })
        .sort(sortDesc);
    }

    if (activeMode === "week") {
      const fallback = weeksForActiveYear[0];
      const weekStartKey = activeWeekStart || fallback?.key;
      if (!weekStartKey) return [];
      const weekStart = parseLocalDateKey(weekStartKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);
      return result
        .filter((t) => {
          const time = getTradeDate(t).getTime();
          return time >= weekStart.getTime() && time <= weekEnd.getTime();
        })
        .sort(sortDesc);
    }

    return result.sort(sortDesc);
  }, [trades, activeMode, activeType, activeYear, activeMonth, activeQuarter, activeWeekStart, activeDay, weeksForActiveYear]);

  const selectedTrade = selectedTradeId
    ? filteredTrades.find((t) => t.id === selectedTradeId) ?? null
    : null;

  // ── Keyboard & outside click ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTradeId(null);
        setPreviewImage(null);
        setShowMenuId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const deleteTrade = async (id: string) => {
    await supabase.from("trades").delete().eq("id", id);
    if (selectedTradeId === id) setSelectedTradeId(null);
  };

  const handleModeClick = (newMode: Period) => {
    const params = new URLSearchParams();
    params.set("mode", newMode);
    params.set("type", activeType);

    const latestYear = years[0] ?? new Date().getFullYear();

    if (newMode === "year") {
      params.set("year", String(latestYear));
    } else if (newMode === "month") {
      const month = getLatestMonthForYear(trades, latestYear);
      params.set("year", String(latestYear));
      params.set("month", String(month));
    } else if (newMode === "quarter") {
      const q = getLatestQuarterForYear(trades, latestYear);
      params.set("year", String(latestYear));
      params.set("quarter", String(q));
    } else if (newMode === "week") {
      const weeks = buildWeeksForYear(trades, latestYear);
      params.set("year", String(latestYear));
      if (weeks[0]) params.set("weekStart", weeks[0].key);
    }

    setSearchParams(params);
  };

  const handleParamChange = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    p.set(key, value);
    setSearchParams(p);
  };

  const openTradeDetail = (id: string) => {
    listScrollRef.current = window.scrollY;
    setSelectedTradeId(id);
    setTimeout(() => {
      tradeDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const closeTradeDetail = () => {
    const closedId = selectedTradeId;
    setSelectedTradeId(null);
    setTimeout(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: "smooth" });
      if (closedId) {
        setHighlightedTradeId(closedId);
        setTimeout(() => setHighlightedTradeId(null), 1600);
      }
    }, 50);
  };

  const countLabel = activeType === "wins" ? "WINS" : activeType === "losses" ? "LOSSES" : "TRADES";

  return (
    <PageWrapper style={{ ...widePageStyle, width: "100%", maxWidth: "800px" }}>
      <header style={{ ...headerStyle, marginBottom: "32px" }}>
        <BackButton />
        <h1
          style={{ ...titleStyle, cursor: "pointer", fontSize: "40px" }}
          onClick={() => { navigate("/history"); window.scrollTo(0, 0); }}
        >
          HISTORY
        </h1>
      </header>

      {/* Period selector */}
      {!activeDay && (
        <HistoryFilters
          activeMode={activeMode}
          activeYear={activeYear}
          activeMonth={activeMonth}
          activeQuarter={activeQuarter}
          activeWeekStart={activeWeekStart}
          years={years}
          availableMonths={availableMonths}
          availableQuarters={availableQuarters}
          weeksForActiveYear={weeksForActiveYear}
          MONTHS={MONTHS}
          onModeChange={handleModeClick}
          onParamChange={handleParamChange}
          formatWeekLabel={formatWeekLabel}
        />
      )}

      {/* Period / day header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        {activeDay ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => navigate("/history")}
              >
                ← ALL
              </Button>
              <h2 style={{ fontSize: "24px", fontWeight: 900 }}>{activeDayLabel}</h2>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em" }}>
              {filteredTrades.length} {countLabel}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 700, letterSpacing: "0.02em" }}>
            {loading ? "REFRESHING DATA…" : `${filteredTrades.length} ${countLabel} FOUND`}
          </div>
        )}

        {!activeDay && (
           <div style={{ display: "flex", gap: "8px" }}>
              <TypeTab active={activeType === "trades"} onClick={() => handleParamChange("type", "trades")}>ALL</TypeTab>
              <TypeTab active={activeType === "wins"} onClick={() => handleParamChange("type", "wins")}>WINS</TypeTab>
              <TypeTab active={activeType === "losses"} onClick={() => handleParamChange("type", "losses")}>LOSSES</TypeTab>
           </div>
        )}
      </div>

      <TradeList
        trades={filteredTrades}
        selectedTradeId={selectedTradeId}
        highlightedTradeId={highlightedTradeId}
        loading={loading}
        onTradeClick={openTradeDetail}
      />

      <div ref={tradeDetailsRef}>
        {selectedTrade && (
          <TradeDetail
            trade={selectedTrade}
            showMenuId={showMenuId}
            onClose={closeTradeDetail}
            onDelete={deleteTrade}
            onToggleMenu={(id) => setShowMenuId(showMenuId === id ? null : id)}
            onPreviewImage={(src, title) => setPreviewImage({ src, title })}
          />
        )}
      </div>

      {previewImage && (
        <Lightbox image={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </PageWrapper>
  );
}

const TypeTab = ({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="btn-press"
    style={{
      fontSize: "11px",
      fontWeight: 800,
      padding: "6px 12px",
      borderRadius: "8px",
      background: active ? "var(--text)" : "var(--panel)",
      color: active ? "#000" : "var(--muted)",
      border: active ? "none" : "1px solid var(--border)",
      letterSpacing: "0.05em",
    }}
  >
    {children}
  </button>
);

function sortDesc(a: Trade, b: Trade) {
  return getTradeDate(b).getTime() - getTradeDate(a).getTime();
}

function parseLocalDateKey(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekLabel(week: { monday: Date; friday: Date }) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
  return `${fmt(week.monday)} – ${fmt(week.friday)}`;
}

export default History;
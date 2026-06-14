import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";
import {
  colors,
  pageStyle,
  quietButtonStyle,
  resultColor,
} from "../ui";

function Home() {
  const [animateIn, setAnimateIn] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setAnimateIn(true), 10);
  return () => clearTimeout(timer);
}, []);
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>(() => {
  const cached = localStorage.getItem("trades_cache");
  return cached ? JSON.parse(cached) : [];
});

  const loadTrades = async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const formattedTrades: Trade[] =
      data?.map((trade) => ({
        id: trade.id,
        instrument: trade.instrument,
        direction: trade.direction,
        result: Number(trade.result),
        comment: trade.comment || "",
        beforeImage: trade.before_image || "",
        afterImage: trade.after_image || "",
        createdAt: trade.created_at,
      })) || [];

    setTrades(formattedTrades);
localStorage.setItem("trades_cache", JSON.stringify(formattedTrades));
  };

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

  const totalTrades = trades.length;
  const totalResult = trades.reduce((sum, trade) => sum + trade.result, 0);
  const wins = trades.filter((trade) => trade.result > 0).length;
  const winRate =
    totalTrades === 0 ? 0 : Math.round((wins / totalTrades) * 100);
  const tradeLabel = totalTrades === 1 ? "TRADE" : "TRADES";

  return (
    <main
  style={{
    ...widePageStyle,
    opacity: animateIn ? 1 : 0,
    transform: animateIn
      ? "translateY(0)"
      : "translateY(12px)",
    transition: "opacity 250ms ease, transform 250ms ease",
  }}
>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "34px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "12px 0 36px",
              fontSize: "62px",
              lineHeight: 0.9,
              fontWeight: 900,
              letterSpacing: 0,
              textAlign: "center",
            }}
          >
            <span style={{ display: "block" }}>TRADING</span>
            <span style={{ display: "block" }}>JOURNAL</span>
          </h1>

          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: colors.muted,
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                marginBottom: "12px",
              }}
            >
              TOTAL RESULT
            </div>

            <div
              style={{
                fontSize: "74px",
                fontWeight: 900,
                lineHeight: 0.95,
                color: resultColor(totalResult),
              }}
            >
              {formatResult(totalResult)}
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <MiniMetric value={String(totalTrades)} label={tradeLabel} />
              <MiniMetric value={`${winRate}%`} label="WR" />
            </div>
          </div>
        </div>

        <nav
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          <button
            type="button"
            style={{
              ...quietButtonStyle,
              padding: "20px",
              background: colors.text,
              color: "#000",
              borderColor: colors.text,
              fontSize: "15px",
            }}
            onClick={() => navigate("/new-trade")}
          >
            NEW TRADE
          </button>

          <button
            type="button"
            style={{ ...quietButtonStyle, padding: "18px" }}
            onClick={() => navigate("/history")}
          >
            HISTORY
          </button>

          <button
            type="button"
            style={{ ...quietButtonStyle, padding: "18px" }}
            onClick={() => navigate("/statistics")}
          >
            STATISTICS
          </button>
        </nav>
      </section>
    </main>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: colors.panelSoft,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: "6px",
          color: colors.muted,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function formatResult(value: number) {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${value >= 0 ? "+" : ""}${text}R`;
}

// temp fix
export default Home;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";
import {
  colors,
  pageStyle,
  quietButtonStyle,
  resultColor,
  sectionStyle,
} from "../ui";

function Home() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);

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
    <main style={pageStyle}>
      <section
        style={{
          minHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "28px",
        }}
      >
        <div>
          <div
            style={{
              color: colors.muted,
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              marginBottom: "18px",
            }}
          >
            TRADING JOURNAL
          </div>

          <div
            style={{
              ...sectionStyle,
              padding: "28px 22px",
              textAlign: "center",
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
                marginTop: "18px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
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

export default Home;

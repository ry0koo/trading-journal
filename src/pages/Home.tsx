import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";

function Home() {
  const navigate = useNavigate();

  const [trades, setTrades] = useState<Trade[]>([]);

useEffect(() => {
  loadTrades();
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

  const totalTrades = trades.length;

  const totalResult = trades.reduce(
    (sum, trade) => sum + trade.result,
    0
  );

  const wins = trades.filter(
    (trade) => trade.result > 0
  ).length;

  const winRate =
    totalTrades === 0
      ? 0
      : Math.round((wins / totalTrades) * 100);

  const recentTrades = [...trades].slice(0, 5);

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        color: "#fff",
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "88px",
          lineHeight: 0.9,
          marginBottom: "40px",
        }}
      >
        TRADING
        <br />
        JOURNAL
      </h1>

      <div
        style={{
          marginBottom: "50px",
        }}
      >
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            lineHeight: 1,
            color:
              totalResult > 0
                ? "#4ade80"
                : totalResult < 0
                ? "#ef4444"
                : "#fff",
          }}
        >
          {totalResult >= 0 ? "+" : ""}
          {Number.isInteger(totalResult)
            ? totalResult
            : totalResult.toFixed(1)}
          R
        </div>

        <div
          style={{
            marginTop: "10px",
            opacity: 0.6,
            fontSize: "18px",
            letterSpacing: "1px",
          }}
        >
          {totalTrades} TRADES • {winRate}% WR
        </div>
      </div>

      <button
        style={navCard}
        onClick={() => navigate("/new-trade")}
      >
        NEW TRADE
      </button>

      <button
        style={navCard}
        onClick={() => navigate("/history")}
      >
        HISTORY
      </button>

      <button
        style={navCard}
        onClick={() => navigate("/statistics")}
      >
        STATISTICS
      </button>

      <div
        style={{
          marginTop: "50px",
        }}
      >
        <h2
          style={{
            fontSize: "34px",
            marginBottom: "20px",
          }}
        >
          RECENT TRADES
        </h2>

        {recentTrades.length === 0 ? (
          <div
            style={{
              opacity: 0.5,
            }}
          >
            No trades yet
          </div>
        ) : (
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "24px",
              overflow: "hidden",
            }}
          >
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr 1fr",
                  alignItems: "center",
                  padding: "20px 24px",
                  borderBottom:
                    "1px solid #1d1d1d",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                  }}
                >
                  {trade.instrument}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    color:
                      trade.direction === "LONG"
                        ? "#4ade80"
                        : "#ef4444",
                  }}
                >
                  {trade.direction}
                </div>

                <div
                  style={{
                    textAlign: "right",
                    color:
                      trade.result >= 0
                        ? "#4ade80"
                        : "#ef4444",
                    fontWeight: 800,
                  }}
                >
                  {trade.result >= 0 ? "+" : ""}
                  {trade.result}R
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const navCard = {
  width: "100%",
  background: "#111",
  border: "1px solid #222",
  color: "#fff",
  padding: "24px",
  borderRadius: "22px",
  marginBottom: "14px",
  fontSize: "20px",
  fontWeight: 800,
  cursor: "pointer",
};

export default Home;
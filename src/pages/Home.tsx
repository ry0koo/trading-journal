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
    fontSize: "78px",
    lineHeight: 0.88,
    marginBottom: "50px",
    fontWeight: 900,
    letterSpacing: "-3px",
    textAlign: "center",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}
>
        <span>TRADING</span>
<span>JOURNAL</span>
      </h1>

      <div
  style={{
    marginBottom: "50px",
    textAlign: "center",
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
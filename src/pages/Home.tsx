import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Trade } from "../types/trade";

function Home() {
  const navigate = useNavigate();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

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
  setLoading(true);

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
  console.error(error);
  setLoading(false);
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
setLoading(false);
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

      const tradeLabel =
  totalTrades === 1 ? "TRADE" : "TRADES";

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
    fontSize: "72px",
    lineHeight: 0.88,
    marginBottom: "28px",
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

      {loading ? (
  <div
    style={{
      fontSize: "24px",
      opacity: 0.5,
      padding: "40px 0",
    }}
  >
    Loading...
  </div>
) : (
  <>
    <div
      style={{
        fontSize: "88px",
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
      {totalTrades} {tradeLabel} • {winRate}% WR
    </div>
  </>
)}

      <button
  style={primaryCard}
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
const primaryCard = {
  ...navCard,
  background: "#151515",
  border: "1px solid #333",
  boxShadow: "0 0 25px rgba(74, 222, 128, 0.08)",
};

export default Home;
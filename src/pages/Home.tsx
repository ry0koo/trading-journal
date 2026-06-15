import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrades } from "../hooks/useTrades";
import { PageWrapper } from "../components/PageWrapper";
import { formatResultR, formatDateOnly, getTradeDate } from "../utils/dateUtils";
import { Button, Card, Badge } from "../components/PremiumUI";

function Home() {
  const navigate = useNavigate();
  const { trades, loading } = useTrades();

  const stats = useMemo(() => {
    const total = trades.length;
    const totalR = trades.reduce((s, t) => s + t.result, 0);
    const wins = trades.filter((t) => t.result > 0).length;
    const winRate = total === 0 ? 0 : Math.round((wins / total) * 100);
    return { total, totalR, wins, winRate };
  }, [trades]);

  const recentTrades = useMemo(() => {
    return [...trades].slice(0, 3);
  }, [trades]);

  return (
    <PageWrapper style={{ padding: "20px 16px 40px", maxWidth: "480px", margin: "0 auto" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: "40px", paddingTop: "20px" }}>

        {/* Hero Section */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 40px",
              fontSize: "clamp(56px, 15vw, 80px)",
              lineHeight: 0.85,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            <span style={{ display: "block" }}>TRADING</span>
            <span style={{ display: "block", color: "var(--text-secondary)" }}>JOURNAL</span>
          </h1>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              marginBottom: "32px"
            }}
          >
             <div style={labelStyle}>OVERALL PERFORMANCE</div>
             <div
              style={{
                fontSize: "clamp(64px, 18vw, 88px)",
                fontWeight: 900,
                lineHeight: 1,
                color: loading ? "var(--faint)" : (stats.totalR >= 0 ? "var(--green)" : "var(--red)"),
                letterSpacing: "-0.03em",
                transition: "all 0.4s ease",
              }}
            >
              {loading ? "···" : formatResultR(stats.totalR)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Card style={{ padding: "16px", textAlign: "left" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1 }}>{loading ? "—" : stats.total}</div>
              <div style={smallLabelStyle}>TOTAL TRADES</div>
            </Card>
            <Card style={{ padding: "16px", textAlign: "left" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, lineHeight: 1 }}>{loading ? "—" : `${stats.winRate}%`}</div>
              <div style={smallLabelStyle}>WIN RATE</div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gap: "12px" }}>
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate("/new-trade")}
            className="glow-inverted"
            style={{ fontSize: "16px", height: "64px", textTransform: "uppercase" }}
          >
            + NEW TRADE
          </Button>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/history")}
              className="glow-button"
              style={{ height: "56px", fontSize: "14px", fontWeight: 800, textTransform: "uppercase" }}
            >
              HISTORY
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/statistics")}
              className="glow-button"
              style={{ height: "56px", fontSize: "14px", fontWeight: 800, textTransform: "uppercase" }}
            >
              STATISTICS
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        {recentTrades.length > 0 && (
          <div>
            <div style={{ ...labelStyle, marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>RECENT ACTIVITY</span>
              <button 
                onClick={() => navigate("/history")}
                style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}
              >
                VIEW ALL ›
              </button>
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {recentTrades.map((trade) => (
                <Card 
                  key={trade.id} 
                  hoverable 
                  onClick={() => navigate(`/history?mode=all&type=trades`)}
                  style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "15px" }}>{trade.instrument}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{formatDateOnly(getTradeDate(trade))}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, color: trade.result >= 0 ? "var(--green)" : "var(--red)" }}>
                      {formatResultR(trade.result)}
                    </div>
                    <Badge color={trade.direction === "LONG" ? "var(--green)" : "var(--red)"} variant="soft">
                      {trade.direction}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageWrapper>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted)",
  fontWeight: 800,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
};

const smallLabelStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "var(--muted)",
  fontSize: "10px",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export default Home;

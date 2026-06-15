import React from "react";
import { Card, Badge } from "./PremiumUI";

interface SessionCardProps {
  session: string;
  total: number;
  wins: number;
  losses: number;
  winrate: number;
  result: number;
  onClick?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  total,
  wins,
  losses,
  winrate,
  result,
  onClick,
}) => {
  const winrateColor = winrate > 55 ? "var(--green)" : winrate >= 45 ? "#facc15" : "var(--red)";

  return (
    <Card 
      hoverable={!!onClick}
      onClick={onClick}
      className={onClick ? "glow-button" : ""}
      style={{ padding: "18px", background: "var(--panel-soft)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "0.02em" }}>{session}</div>
        <Badge variant="soft" color="var(--muted)">{total} TRADES</Badge>
      </div>
      
      <div style={{ fontSize: "32px", fontWeight: 900, color: winrateColor, lineHeight: 1, marginBottom: "8px" }}>
        {winrate.toFixed(0)}%
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>
          W {wins} · L {losses}
        </div>
        <div style={{ fontWeight: 900, fontSize: "13px", color: result >= 0 ? "var(--green)" : "var(--red)" }}>
          {result >= 0 ? "+" : ""}{result.toFixed(2)}R
        </div>
      </div>
    </Card>
  );
};

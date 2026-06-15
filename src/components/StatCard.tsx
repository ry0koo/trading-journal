import React from "react";
import { Card } from "./PremiumUI";

interface StatCardProps {
  value: string;
  label: string;
  color?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, color = "var(--text)", onClick }) => {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
      }}
    >
      <div style={{ fontSize: "clamp(32px, 8vw, 42px)", fontWeight: 900, lineHeight: 1, color }}>
        {value}
      </div>
      <div style={{ color: "var(--muted)", fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </div>
    </Card>
  );
};

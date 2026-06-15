import React from "react";
import { formatResultR, formatDateOnly, getTradeDate } from "../utils/dateUtils";
import type { Trade } from "../types/trade";

interface TradeRowProps {
  trade: Trade;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export const TradeRow: React.FC<TradeRowProps> = ({
  trade,
  isSelected,
  isHighlighted,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="trade-row btn-press"
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1.8fr 0.9fr 0.9fr 1.1fr 18px",
        gap: "16px",
        alignItems: "center",
        padding: "16px 20px",
        whiteSpace: "nowrap",
        background: isHighlighted
          ? "rgba(74,222,128,0.08)"
          : isSelected
          ? "var(--panel-hover)"
          : "transparent",
        border: "none",
        borderBottom: "1px solid var(--border)",
        color: "var(--text)",
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
        zIndex: isSelected ? 2 : 1,
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
        {trade.instrument}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "13px",
          color: trade.direction === "LONG" ? "var(--green)" : "var(--red)",
        }}
      >
        {trade.direction}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: "14px",
          color: trade.result >= 0 ? "var(--green)" : "var(--red)",
        }}
      >
        {formatResultR(trade.result)}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
        {formatDateOnly(getTradeDate(trade))}
      </div>
      <div style={{ color: "var(--muted)", fontSize: "16px", textAlign: "right" }}>›</div>
    </button>
  );
};

interface TradeListProps {
  trades: Trade[];
  selectedTradeId: string | null;
  highlightedTradeId: string | null;
  loading: boolean;
  onTradeClick: (id: string) => void;
}

export const TradeList: React.FC<TradeListProps> = ({
  trades,
  selectedTradeId,
  highlightedTradeId,
  loading,
  onTradeClick,
}) => {
  if (trades.length === 0 && !loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", opacity: 0.5 }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📭</div>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>No trades found</div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "20px",
        overflow: "hidden",
        background: "var(--panel)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={tableHeaderStyle}>
        <div>Symbol</div>
        <div>Type</div>
        <div>Result</div>
        <div>Date</div>
        <div />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {trades.map((trade, index) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            index={index}
            isSelected={selectedTradeId === trade.id}
            isHighlighted={highlightedTradeId === trade.id}
            onClick={() => onTradeClick(trade.id)}
          />
        ))}
      </div>
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.8fr 0.9fr 0.9fr 1.1fr 18px",
  gap: "16px",
  padding: "14px 20px",
  color: "var(--muted)",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  borderBottom: "1px solid var(--border)",
  textTransform: "uppercase",
  background: "rgba(255, 255, 255, 0.02)",
};

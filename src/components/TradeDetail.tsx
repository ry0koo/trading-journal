import React from "react";
import { useNavigate } from "react-router-dom";
import { formatResultR, formatDateOnly, getTradeDate } from "../utils/dateUtils";
import type { Trade } from "../types/trade";
import { Badge, Card } from "./PremiumUI";

interface TradeDetailProps {
  trade: Trade;
  showMenuId: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onPreviewImage: (src: string, title: string) => void;
}

export const TradeDetail: React.FC<TradeDetailProps> = ({
  trade,
  showMenuId,
  onClose,
  onDelete,
  onToggleMenu,
  onPreviewImage,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      style={{
        marginTop: "24px",
        padding: "32px",
        background: "var(--panel-soft)",
        border: "1px solid var(--border-strong)",
        animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <div>
          <div style={{ fontSize: "36px", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em" }}>
            {trade.instrument}
          </div>

          <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Badge color={trade.direction === "LONG" ? "var(--green)" : "var(--red)"}>
              {trade.direction}
            </Badge>
            {trade.session && <Badge>{trade.session}</Badge>}
            <Badge color="var(--text-secondary)">{formatDateOnly(getTradeDate(trade))}</Badge>
            <Badge
              color={trade.result >= 0 ? "var(--green)" : "var(--red)"}
              variant="outline"
            >
              {formatResultR(trade.result)}
            </Badge>
          </div>

          {trade.comment && (
            <div style={{ marginTop: "24px", maxWidth: "800px" }}>
              <div style={detailLabelStyle}>ANALYSIS & NOTES</div>
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "15px" }}>
                {trade.comment}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(trade.id);
              }}
              className="btn-press"
              style={iconBtnStyle}
            >
              ···
            </button>

            {showMenuId === trade.id && (
              <div style={dropdownStyle}>
                <button
                  style={dropdownItemStyle}
                  onClick={() => {
                    navigate(`/new-trade?edit=${trade.id}`);
                    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                  }}
                >
                  Edit Trade
                </button>
                <div style={{ height: "1px", background: "var(--border)" }} />
                <button
                  style={{ ...dropdownItemStyle, color: "var(--red)" }}
                  onClick={() => onDelete(trade.id)}
                >
                  Delete Trade
                </button>
              </div>
            )}
          </div>

          <button type="button" onClick={onClose} className="btn-press" style={iconBtnStyle}>
            ✕
          </button>
        </div>
      </div>

      {/* Screenshots */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px" }}>
        <ImageBlock
          title="BEFORE ENTRY"
          image={trade.beforeImage}
          onClick={() => trade.beforeImage && onPreviewImage(trade.beforeImage, "Before Entry")}
        />
        <ImageBlock
          title="AFTER EXIT"
          image={trade.afterImage}
          onClick={() => trade.afterImage && onPreviewImage(trade.afterImage, "After Exit")}
        />
      </div>
    </Card>
  );
};

const ImageBlock = ({ title, image, onClick }: { title: string; image?: string; onClick: () => void }) => (
  <div>
    <div style={detailLabelStyle}>{title}</div>
    {image ? (
      <div
        onClick={onClick}
        className="btn-press"
        style={{
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          cursor: "zoom-in",
          aspectRatio: "16/10",
        }}
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    ) : (
      <div
        style={{
          width: "100%",
          aspectRatio: "16/10",
          borderRadius: "16px",
          border: "1px dashed var(--border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        NO SCREENSHOT
      </div>
    )}
  </div>
);

const detailLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontWeight: 800,
  marginBottom: "10px",
};

const iconBtnStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--text)",
  fontSize: "18px",
  cursor: "pointer",
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "50px",
  right: 0,
  background: "var(--panel-soft)",
  border: "1px solid var(--border-strong)",
  borderRadius: "14px",
  overflow: "hidden",
  zIndex: 100,
  minWidth: "160px",
  boxShadow: "var(--shadow-lg)",
};

const dropdownItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  background: "transparent",
  border: "none",
  color: "var(--text)",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
  transition: "background 0.2s ease",
};

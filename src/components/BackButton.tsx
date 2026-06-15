import { useNavigate } from "react-router-dom";
import { popRoute } from "../navigationMemory";

interface BackButtonProps {
  to?: string;
}

export function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }
    const prev = popRoute();
    navigate(prev ?? "/");
  };

  return (
    <button
      type="button"
      className="btn-press"
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "10px 14px",
        fontSize: "12px",
        fontWeight: 800,
        color: "var(--text)",
        letterSpacing: "0.05em",
      }}
    >
      <span style={{ fontSize: "16px", color: "var(--muted)" }}>←</span>
      BACK
    </button>
  );
}

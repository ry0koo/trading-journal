import { memo } from "react";
import type { ReactNode } from "react";

interface PeriodButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function PeriodButtonInner({ active, onClick, children }: PeriodButtonProps) {
  return (
    <button
      type="button"
      className="btn-press"
      onClick={onClick}
      style={{
        padding: "10px",
        borderRadius: "10px",
        background: active ? "var(--text)" : "transparent",
        color: active ? "#000" : "var(--muted)",
        border: active ? "1px solid var(--text)" : "1px solid var(--border)",
        fontSize: "10px",
        fontWeight: 900,
        letterSpacing: "0.08em",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </button>
  );
}

export const PeriodButton = memo(PeriodButtonInner);

type Period = "week" | "month" | "quarter" | "year" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "WEEK" },
  { value: "month", label: "MONTH" },
  { value: "quarter", label: "QTR" },
  { value: "year", label: "YEAR" },
  { value: "all", label: "ALL" },
];

interface PeriodFilterProps {
  mode: Period;
  onChange: (mode: Period) => void;
}

export function PeriodFilter({ mode, onChange }: PeriodFilterProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "6px",
      }}
    >
      {PERIODS.map((p) => (
        <PeriodButton
          key={p.value}
          active={mode === p.value}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </PeriodButton>
      ))}
    </div>
  );
}

export type { Period };

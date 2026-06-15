import React from "react";
import { selectStyle } from "../ui";
import { PeriodFilter } from "./PeriodFilter";
import type { Period } from "./PeriodFilter";
import { Card } from "./PremiumUI";

interface HistoryFiltersProps {
  activeMode: Period;
  activeYear: number;
  activeMonth: number;
  activeQuarter: number;
  activeWeekStart: string | null;
  years: number[];
  availableMonths: number[];
  availableQuarters: number[];
  weeksForActiveYear: { key: string; monday: Date; friday: Date }[];
  MONTHS: string[];
  onModeChange: (mode: Period) => void;
  onParamChange: (key: string, value: string) => void;
  formatWeekLabel: (week: { key: string; monday: Date; friday: Date }) => string;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  activeMode,
  activeYear,
  activeMonth,
  activeQuarter,
  activeWeekStart,
  years,
  availableMonths,
  availableQuarters,
  weeksForActiveYear,
  MONTHS,
  onModeChange,
  onParamChange,
  formatWeekLabel,
}) => {
  return (
    <Card style={{ marginBottom: "12px", padding: "18px" }}>
      <PeriodFilter mode={activeMode} onChange={onModeChange} />

      {activeMode !== "all" && (
        <div style={filterGridStyle}>
          <select
            value={activeYear}
            onChange={(e) => onParamChange("year", e.target.value)}
            style={selectStyle}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {activeMode === "month" && (
            <select
              value={activeMonth}
              onChange={(e) => onParamChange("month", e.target.value)}
              style={selectStyle}
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{MONTHS[m]}</option>
              ))}
            </select>
          )}

          {activeMode === "quarter" && (
            <select
              value={activeQuarter}
              onChange={(e) => onParamChange("quarter", e.target.value)}
              style={selectStyle}
            >
              {availableQuarters.map((q) => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
          )}

          {activeMode === "week" && (
            <select
              value={activeWeekStart ?? ""}
              onChange={(e) => onParamChange("weekStart", e.target.value)}
              style={selectStyle}
            >
              {weeksForActiveYear.map((w) => (
                <option key={w.key} value={w.key}>
                  {formatWeekLabel(w)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </Card>
  );
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

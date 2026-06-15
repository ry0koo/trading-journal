import React from "react";
import { PeriodFilter } from "./PeriodFilter";
import type { Period } from "./PeriodFilter";
import { Card } from "./PremiumUI";
import { selectStyle } from "../ui";
import type { TradingWeek } from "../utils/dateUtils";

interface StatisticsFiltersProps {
  mode: Period;
  selectedYear: number;
  selectedMonth: number;
  selectedQuarter: number;
  selectedWeek: number;
  yearsToShow: number[];
  availableMonths: number[];
  availableQuarters: number[];
  availableWeeks: TradingWeek[];
  MONTHS: string[];
  setMode: (mode: Period) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedQuarter: (quarter: number) => void;
  setSelectedWeek: (week: number) => void;
  formatWeekLabel: (date: Date) => string;
}

export const StatisticsFilters: React.FC<StatisticsFiltersProps> = ({
  mode,
  selectedYear,
  selectedMonth,
  selectedQuarter,
  selectedWeek,
  yearsToShow,
  availableMonths,
  availableQuarters,
  availableWeeks,
  MONTHS,
  setMode,
  setSelectedYear,
  setSelectedMonth,
  setSelectedQuarter,
  setSelectedWeek,
  formatWeekLabel,
}) => {
  return (
    <Card style={{ marginBottom: "16px", padding: "18px" }}>
      <PeriodFilter mode={mode} onChange={setMode} />

      {mode !== "all" && (
        <div style={filterGridStyle}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={selectStyle}
          >
            {yearsToShow.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {mode === "month" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={selectStyle}
            >
              {availableMonths.length === 0 ? (
                <option value={0}>No data</option>
              ) : (
                availableMonths.map((m) => (
                  <option key={m} value={m}>{MONTHS[m]}</option>
                ))
              )}
            </select>
          )}

          {mode === "quarter" && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              style={selectStyle}
            >
              {availableQuarters.length === 0 ? (
                <option value={1}>No data</option>
              ) : (
                availableQuarters.map((q) => (
                  <option key={q} value={q}>Q{q}</option>
                ))
              )}
            </select>
          )}

          {mode === "week" && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              style={selectStyle}
            >
              {availableWeeks.length === 0 ? (
                <option value={0}>No data</option>
              ) : (
                availableWeeks.map((w, i) => (
                  <option key={w.key} value={i}>
                    {formatWeekLabel(w.monday)} — {formatWeekLabel(w.friday)}
                  </option>
                ))
              )}
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

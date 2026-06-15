import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { EquityPoint } from "../utils/chartUtils";

interface EquityChartProps {
  data: EquityPoint[];
  onPointClick?: (point: EquityPoint) => void;
  selectedPointKey?: string | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: EquityPoint }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const positive = point.equity >= 0;
  const color = positive ? "var(--green)" : "var(--red)";

  return (
    <div
      style={{
        background: "rgba(18, 18, 18, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--border-strong)",
        borderRadius: "14px",
        padding: "12px 16px",
        minWidth: "160px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "var(--muted)",
          fontWeight: 800,
          letterSpacing: "0.1em",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}
      >
        {point.dateLabel} · {point.tradesCount} {point.tradesCount === 1 ? "trade" : "trades"}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          color,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {positive ? "+" : ""}{point.equity.toFixed(2)}R
      </div>
    </div>
  );
}

export function EquityChart({ data, onPointClick, selectedPointKey }: EquityChartProps) {
  const lastEquity = data.length > 0 ? data[data.length - 1].equity : 0;
  const isPositive = lastEquity >= 0;
  const lineColor = isPositive ? "var(--green)" : "var(--red)";
  const fillId = isPositive ? "equityFillGreen" : "equityFillRed";

  const yAxisWidth = useMemo(() => {
    if (data.length === 0) return 32;
    const maxAbs = Math.max(...data.map((d) => Math.abs(d.equity)));
    if (maxAbs >= 100) return 48;
    if (maxAbs >= 10) return 40;
    return 32;
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--panel)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          color: "var(--muted)",
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>📊</div>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>WAITING FOR DATA</div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--panel)",
        borderRadius: "24px",
        border: "1px solid var(--border)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="equityFillGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--green)" stopOpacity={0.25} />
              <stop offset="60%" stopColor="var(--green)" stopOpacity={0.05} />
              <stop offset="100%" stopColor="var(--green)" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="equityFillRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--red)" stopOpacity={0.25} />
              <stop offset="60%" stopColor="var(--red)" stopOpacity={0.05} />
              <stop offset="100%" stopColor="var(--red)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })
            }
            tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            minTickGap={50}
            dy={10}
          />

          <YAxis
            width={yAxisWidth}
            tick={{ fill: "var(--muted)", fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}R`}
            dx={-10}
          />

          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }} 
            animationDuration={200}
          />

          <Area
            type="monotone"
            dataKey="equity"
            stroke={lineColor}
            strokeWidth={3}
            fill={`url(#${fillId})`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload && payload.dayKey === selectedPointKey) {
                return (
                  <circle
                    key={`dot-${payload.dayKey}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={lineColor}
                    stroke="var(--bg)"
                    strokeWidth={3}
                    style={{ filter: "drop-shadow(0 0 8px currentColor)" }}
                  />
                );
              }
              return null;
            }}
            activeDot={{
              r: 6,
              fill: lineColor,
              stroke: "var(--bg)",
              strokeWidth: 3,
              style: { cursor: "pointer", filter: "drop-shadow(0 0 8px currentColor)" },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick: (props: any) => {
                if (props?.payload && onPointClick) {
                  onPointClick(props.payload as EquityPoint);
                }
              },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

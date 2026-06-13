import type { CSSProperties } from "react";

export const colors = {
  bg: "#050505",
  panel: "#0f0f0f",
  panelSoft: "#141414",
  border: "#242424",
  borderStrong: "#343434",
  text: "#ffffff",
  muted: "#8b8b8b",
  faint: "#5f5f5f",
  green: "#4ade80",
  red: "#ef4444",
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
};

export const pageStyle: CSSProperties = {
  background: colors.bg,
  minHeight: "100vh",
  color: colors.text,
  padding: "24px",
  maxWidth: "520px",
  margin: "0 auto",
};

export const widePageStyle: CSSProperties = {
  ...pageStyle,
  maxWidth: "860px",
};

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "24px",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "44px",
  lineHeight: 0.95,
  fontWeight: 900,
  letterSpacing: 0,
};

export const sectionStyle: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  padding: "18px",
};

export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "12px",
  color: colors.muted,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "16px",
  marginBottom: "16px",
  background: colors.panel,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  marginBottom: 0,
};

export const quietButtonStyle: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  padding: "12px 16px",
  borderRadius: radii.sm,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

export const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "18px",
  background: colors.text,
  color: "#000",
  border: "none",
  borderRadius: radii.md,
  fontWeight: 900,
  fontSize: "15px",
  cursor: "pointer",
};

export const segmentedRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "16px",
};

export const segmentStyle: CSSProperties = {
  padding: "15px",
  background: colors.panel,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "14px",
};

export const activeSegmentStyle: CSSProperties = {
  ...segmentStyle,
  background: colors.text,
  color: "#000",
  borderColor: colors.text,
};

export function resultColor(value: number) {
  if (value > 0) return colors.green;
  if (value < 0) return colors.red;
  return colors.text;
}

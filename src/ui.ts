import type { CSSProperties } from "react";

/* ─── Color palette ─────────────────────────────────────────── */
export const colors = {
  bg: "#050505",
  panel: "#0e0e0e",
  panelSoft: "#151515",
  border: "#252525",
  borderStrong: "#353535",
  text: "#ffffff",
  muted: "#8d8d8d",
  faint: "#646464",
  green: "#4ade80",
  red: "#ef4444",
} as const;

/* ─── Border radii ──────────────────────────────────────────── */
export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

/* ─── Page layouts ──────────────────────────────────────────── */
export const pageStyle: CSSProperties = {
  background: colors.bg,
  minHeight: "100dvh",
  color: colors.text,
  padding: "20px 16px 40px",
  maxWidth: "520px",
  margin: "0 auto",
};

export const widePageStyle: CSSProperties = {
  background: colors.bg,
  minHeight: "100dvh",
  color: colors.text,
  padding: "24px 16px 48px",
  maxWidth: "920px",
  margin: "0 auto",
};

/* ─── Common layout primitives ──────────────────────────────── */
export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "24px",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 9vw, 44px)",
  lineHeight: 0.95,
  fontWeight: 900,
  letterSpacing: "-0.01em",
};

export const sectionStyle: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  padding: "18px 20px",
};

/* ─── Form elements ─────────────────────────────────────────── */
export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "10px",
  fontSize: "11px",
  color: colors.muted,
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "15px 16px",
  marginBottom: "16px",
  background: colors.panel,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  fontSize: "16px",
  outline: "none",
  transition: "border-color 0.18s ease, background 0.18s ease",
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  marginBottom: 0,
};

/* ─── Buttons ───────────────────────────────────────────────── */
export const quietButtonStyle: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  padding: "11px 16px",
  borderRadius: radii.sm,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
  letterSpacing: "0.05em",
  transition: "all 0.18s ease",
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
  letterSpacing: "0.05em",
  cursor: "pointer",
  transition: "opacity 0.18s ease, transform 0.18s ease",
};

/* ─── Segmented controls ────────────────────────────────────── */
export const segmentedRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "16px",
};

export const segmentStyle: CSSProperties = {
  padding: "13px",
  background: colors.panel,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
  letterSpacing: "0.04em",
  transition: "all 0.15s ease",
};

export const activeSegmentStyle: CSSProperties = {
  ...segmentStyle,
  background: colors.text,
  color: "#000",
  borderColor: colors.text,
};

/* ─── Utilities ─────────────────────────────────────────────── */
export function resultColor(value: number): string {
  if (value > 0) return colors.green;
  if (value < 0) return colors.red;
  return colors.muted;
}

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, className, onClick, hoverable, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`premium-panel ${hoverable ? "btn-press" : ""} ${className || ""}`}
      style={{
        padding: "24px",
        borderRadius: "24px",
        cursor: onClick ? "pointer" : "default",
        background: "var(--panel)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  style,
  className,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          background: "var(--text)",
          color: "#000",
          fontWeight: 800,
        };
      case "secondary":
        return {
          background: "var(--panel-soft)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        };
      case "quiet":
        return {
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        };
      case "danger":
        return {
          background: "var(--red-soft)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "var(--red)",
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case "sm":
        return { padding: "10px 16px", fontSize: "12px", borderRadius: "12px" };
      case "md":
        return { padding: "14px 24px", fontSize: "14px", borderRadius: "16px" };
      case "lg":
        return { padding: "18px 32px", fontSize: "16px", borderRadius: "20px" };
      default:
        return {};
    }
  };

  return (
    <button
      className={`btn-press ${className || ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fullWidth ? "100%" : "auto",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: "solid" | "outline" | "soft";
}

export const Badge: React.FC<BadgeProps> = ({ children, color = "var(--text)", variant = "soft" }) => {
  const styles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  if (variant === "soft") {
    styles.background = `${color}15`;
    styles.color = color;
  } else if (variant === "outline") {
    styles.border = `1px solid ${color}40`;
    styles.color = color;
  } else {
    styles.background = color;
    styles.color = "#000";
  }

  return <span style={styles}>{children}</span>;
};

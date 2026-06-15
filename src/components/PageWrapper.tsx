import type { ReactNode, CSSProperties } from "react";
import { usePageTransition } from "../hooks/usePageTransition";

interface PageWrapperProps {
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Wraps every page with the standard fade-in / slide-up entry animation.
 * Accepts an optional style override for layout (max-width etc.)
 */
export function PageWrapper({ style, children }: PageWrapperProps) {
  const animateIn = usePageTransition();

  return (
    <main
      style={{
        background: "#050505",
        minHeight: "100dvh",
        color: "#ffffff",
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.38s cubic-bezier(0.16,1,0.3,1), transform 0.38s cubic-bezier(0.16,1,0.3,1)",
        ...style,
      }}
    >
      {children}
    </main>
  );
}

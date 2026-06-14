import { useEffect, useState } from "react";

export function usePageTransition() {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setAnimateIn(true), 10);
    return () => clearTimeout(id);
  }, []);

  return animateIn;
}
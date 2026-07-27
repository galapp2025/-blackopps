"use client";

import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  className?: string;
  locale?: string;
};

export function AnimatedCounter({
  value,
  duration = 1000,
  className = "stat-mega text-gradient-brand",
  locale = "he-IL",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }
    let start = 0;
    const step = value / Math.max(1, duration / 16);
    const timer = window.setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        window.clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => window.clearInterval(timer);
  }, [value, duration]);

  return (
    <span className={className} aria-label={value.toLocaleString(locale)}>
      {display.toLocaleString(locale)}
    </span>
  );
}

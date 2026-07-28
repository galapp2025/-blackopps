"use client";

import { useEffect, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  from?: number;
  duration?: number;
  className?: string;
  locale?: string;
};

export function AnimatedNumber({
  value,
  from,
  duration = 1200,
  className = "",
  locale = "he-IL",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(from ?? value);

  useEffect(() => {
    const start = display;
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || start === value) {
      setDisplay(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last rendered value toward new target
  }, [value, duration]);

  return (
    <span className={className} aria-label={value.toLocaleString(locale)}>
      {display.toLocaleString(locale)}
    </span>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";

export function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(count, "change", (current) => {
    setDisplayValue(Math.round(current));
  });

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(count, value, {
      duration: 1.5,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [count, isInView, value]);

  return (
    <motion.span ref={ref}>
      {displayValue}
      {suffix}
    </motion.span>
  );
}

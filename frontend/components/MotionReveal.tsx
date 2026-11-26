"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function RevealCard({
  children,
  className,
  delay = 0,
  hoverLift = false,
  tilt = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverLift?: boolean;
  tilt?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay }}
      whileHover={
        tilt
          ? {
              rotateX: 4,
              rotateY: -4,
              scale: 1.02,
              transition: { duration: 0.2 },
            }
          : hoverLift
            ? { y: -5 }
            : undefined
      }
      whileTap={{ scale: 0.98 }}
      style={tilt ? { transformStyle: "preserve-3d" } : undefined}
      className={className}
    >
      {children}
    </motion.article>
  );
}

export function RevealSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function PulseOrb({ className }: { className: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      animate={{ scale: [1, 1.13, 1], opacity: [0.35, 0.7, 0.35] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

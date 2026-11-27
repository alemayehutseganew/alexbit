"use client";

import { Children, type ReactNode } from "react";
import { motion } from "framer-motion";

export function RevealCard({
  children,
  className,
  delay = 0,
  hoverLift = false,
  tilt = false,
  direction,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverLift?: boolean;
  tilt?: boolean;
  direction?: "left" | "right";
}) {
  return (
    <motion.article
      initial={
        direction
          ? { opacity: 0, x: direction === "left" ? -32 : 32 }
          : { opacity: 0, y: 22 }
      }
      whileInView={{ opacity: 1, x: 0, y: 0 }}
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
            : { scale: 1.02, y: -2 }
      }
      whileTap={{ scale: 0.98 }}
      style={tilt ? { transformStyle: "preserve-3d" } : undefined}
      className={className}
    >
      {children}
    </motion.article>
  );
}

export function StaggeredReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.14 } },
      }}
      className={className}
    >
      {Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: "easeOut" },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
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

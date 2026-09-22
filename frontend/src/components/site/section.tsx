"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** Fades content in once as it enters the viewport; a no-op when the visitor
 *  prefers reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("border-t border-[var(--color-border)] py-20 sm:py-24", className)}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--color-ink-subtle)] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-pretty text-sm leading-relaxed text-[var(--color-ink-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

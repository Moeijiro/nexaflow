import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "positive" | "warning" | "danger" | "cyan";

const TONES: Record<Tone, string> = {
  neutral:
    "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-ink-muted)]",
  accent: "border-[#3b3573] bg-[var(--color-accent-soft)] text-[#b5aeff]",
  cyan: "border-[#1d4e58] bg-[#0c2026] text-[var(--color-cyan)]",
  positive: "border-[#1f5241] bg-[#0d2119] text-[var(--color-positive)]",
  warning: "border-[#5a4520] bg-[#241c0f] text-[var(--color-warning)]",
  danger: "border-[#4a2630] bg-[#241419] text-[var(--color-danger)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = "neutral", pulse = false }: { tone?: Tone; pulse?: boolean }) {
  const color: Record<Tone, string> = {
    neutral: "bg-[var(--color-ink-subtle)]",
    accent: "bg-[var(--color-accent)]",
    cyan: "bg-[var(--color-cyan)]",
    positive: "bg-[var(--color-positive)]",
    warning: "bg-[var(--color-warning)]",
    danger: "bg-[var(--color-danger)]",
  };
  return (
    <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
      {pulse ? (
        <span
          className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", color[tone])}
        />
      ) : null}
      <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", color[tone])} />
    </span>
  );
}

/** Execution status, rendered the same way everywhere it appears. */
export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "success" ? "positive" : status === "failed" ? "danger" : "warning";
  return <Badge tone={tone}>{status}</Badge>;
}

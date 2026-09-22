import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-mono text-xl tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">{hint}</p> : null}
    </div>
  );
}

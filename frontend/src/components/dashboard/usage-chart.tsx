"use client";

import { useState } from "react";
import type { Stats } from "@/lib/types";

/**
 * Executions per hour for the last 24 hours, drawn as inline SVG. A charting
 * library would be tens of kilobytes for one bar chart; this is one file and
 * scales with its container.
 */
export function UsageChart({ series }: { series: Stats["series"] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((point) => point.total));
  const width = 100;
  const height = 32;
  const gap = 0.4;
  const barWidth = width / series.length - gap;
  const active = hovered !== null ? series[hovered] : null;

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Executions per hour over the last 24 hours"
        className="h-32 w-full"
      >
        <line x1="0" y1={height} x2={width} y2={height} stroke="var(--color-border)" strokeWidth="0.2" />
        {series.map((point, index) => {
          const total = Math.max(point.total, 0);
          const barHeight = (total / max) * (height - 2);
          const failedHeight = total ? (point.failed / max) * (height - 2) : 0;
          const x = index * (barWidth + gap);
          return (
            <g
              key={point.bucket}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect x={x} y={0} width={barWidth + gap} height={height} fill="transparent" />
              <rect
                x={x}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                rx="0.3"
                fill={hovered === index ? "var(--color-ink)" : "var(--color-accent)"}
                opacity={total ? 1 : 0.15}
              />
              {failedHeight > 0 ? (
                <rect
                  x={x}
                  y={height - failedHeight}
                  width={barWidth}
                  height={failedHeight}
                  rx="0.3"
                  fill="var(--color-danger)"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-subtle)]">
        <span>{formatHour(series[0]?.bucket)}</span>
        <span className="text-[var(--color-ink-muted)]">
          {active
            ? `${formatHour(active.bucket)} · ${active.total} run${active.total === 1 ? "" : "s"}` +
              (active.failed ? ` · ${active.failed} failed` : "")
            : `peak ${max}/h`}
        </span>
        <span>now</span>
      </div>
    </div>
  );
}

function formatHour(bucket: string | undefined): string {
  if (!bucket) return "";
  // The API sends naive UTC hour buckets.
  return new Date(`${bucket}Z`).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

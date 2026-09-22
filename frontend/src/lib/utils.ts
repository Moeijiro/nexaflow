import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware class merge, used by every component. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 45) return "just now";
  for (const [unit, size] of UNITS) {
    if (seconds >= size) {
      const value = Math.round(seconds / size);
      if (unit === "day" && value > 6) break;
      return RELATIVE.format(-value, unit);
    }
  }
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteTime(iso: string | null | undefined): string {
  return iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })
    : "—";
}

export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export const ACTION_LABELS: Record<string, string> = {
  discord: "Discord",
  telegram: "Telegram",
  http: "HTTP request",
};

/**
 * Build a sample payload from the placeholders a workflow actually uses.
 *
 * A generic `{ "order_id": 1024 }` does not fit a workflow whose transform
 * reads `{{order.id}}`, so the Test button prefills a payload shaped like the
 * templates themselves. Numeric-sounding leaves get numbers so JSON templates
 * that interpolate bare values stay valid.
 */
const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_.\-[\]]+)\s*\}\}/g;
const NUMERIC_HINTS = ["amount", "total", "count", "price", "qty", "quantity", "id_number"];

export function samplePayloadFromTemplates(templates: (string | null | undefined)[]) {
  const paths = new Set<string>();
  for (const template of templates) {
    if (!template) continue;
    for (const match of template.matchAll(PLACEHOLDER_RE)) paths.add(match[1]);
  }
  if (paths.size === 0) return { order_id: 1024, customer: "Alex", amount: 49.99 };

  const payload: Record<string, unknown> = {};
  for (const path of paths) {
    const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
    let cursor: Record<string, unknown> = payload;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        const leaf = part.toLowerCase();
        cursor[part] = NUMERIC_HINTS.some((hint) => leaf.includes(hint))
          ? 49.99
          : leaf.endsWith("id")
            ? "A-1042"
            : `sample ${part}`;
        return;
      }
      if (typeof cursor[part] !== "object" || cursor[part] === null) cursor[part] = {};
      cursor = cursor[part] as Record<string, unknown>;
    });
  }
  return payload;
}

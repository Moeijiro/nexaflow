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

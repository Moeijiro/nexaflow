import { Activity, CheckCircle2, Clock, Workflow } from "lucide-react";

/** A static rendering of the dashboard's own layout — same components, same
 *  numbers a fresh demo account produces after `python -m app.seed`. */
const TILES = [
  { label: "Active workflows", value: "3", icon: Workflow },
  { label: "Executions today", value: "8", icon: Activity },
  { label: "Successful", value: "7", icon: CheckCircle2 },
  { label: "Avg duration", value: "191 ms", icon: Clock },
];

const ROWS = [
  { workflow: "Lead notifications", status: "success", time: "1.5 ms", when: "12:04:21" },
  { workflow: "Order processing", status: "failed", time: "1.51 s", when: "12:03:58" },
  { workflow: "Order processing", status: "success", time: "1.2 ms", when: "12:03:51" },
  { workflow: "Uptime alerts", status: "success", time: "0.5 ms", when: "12:03:44" },
];

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-6 -top-10 h-40 glow-accent" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_40px_120px_-60px_rgba(123,108,255,0.6)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#2a2d3e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#2a2d3e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#2a2d3e]" />
          </span>
          <span className="ml-2 font-mono text-[11px] text-[var(--color-ink-subtle)]">
            nexaflow.dev/dashboard
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {TILES.map((tile) => (
              <div
                key={tile.label}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] px-4 py-3"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
                  <tile.icon className="h-3 w-3" aria-hidden />
                  {tile.label}
                </div>
                <p className="mt-1 font-mono text-xl tabular-nums">{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            <div className="border-b border-[var(--color-border)] px-4 py-2.5 text-xs font-medium">
              Recent executions
            </div>
            <table className="w-full text-left">
              <tbody>
                {ROWS.map((row, index) => (
                  <tr key={index} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5 text-xs">{row.workflow}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          row.status === "success"
                            ? "rounded-md border border-[#1f5241] bg-[#0d2119] px-2 py-0.5 text-[10px] text-[var(--color-positive)]"
                            : "rounded-md border border-[#4a2630] bg-[#241419] px-2 py-0.5 text-[10px] text-[var(--color-danger)]"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px] text-[var(--color-ink-muted)]">
                      {row.time}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right font-mono text-[11px] text-[var(--color-ink-subtle)] sm:table-cell">
                      {row.when}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

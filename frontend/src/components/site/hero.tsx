import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { WorkflowDiagram } from "@/components/site/workflow-diagram";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* One grid, one glow. Both are decorative and hidden from assistive tech. */}
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] glow-accent" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" aria-hidden />
            Webhooks, transforms and actions — documented API
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            <span className="text-gradient">Automate the work between your tools.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-[var(--color-ink-muted)] sm:text-lg">
            Build workflows that connect APIs, webhooks and messaging platforms without manually
            repeating the same tasks.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Start building
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/login?demo=1" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                View demo
              </Button>
            </Link>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--color-ink-subtle)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Open source · no credit card · runs locally on SQLite
          </p>
        </div>

        <div className="mt-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 backdrop-blur-sm sm:mt-16 sm:p-6">
          <WorkflowDiagram />
        </div>
      </div>
    </div>
  );
}

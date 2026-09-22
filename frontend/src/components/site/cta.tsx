import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center sm:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 glow-accent" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-60" aria-hidden />
      <div className="relative">
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Stop doing the same three clicks every day.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-sm text-[var(--color-ink-muted)]">
          Create a workflow, point a webhook at it, and let NexaFlow handle the rest — with a
          record of every run.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Start building
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <Link href="/docs" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Read the docs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

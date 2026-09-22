import { cn } from "@/lib/utils";

/** The NexaFlow mark: a single stroke folding back on itself. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none">
        <path
          d="M10 22V10l12 12V10"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-[0_0_0_1px_rgba(123,108,255,0.6),0_8px_24px_-12px_rgba(123,108,255,0.9)] hover:bg-[#6b5cf0]",
  secondary:
    "border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] hover:border-[#3a3e55] hover:bg-[#171926]",
  ghost:
    "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]",
  danger:
    "border border-[#4a2630] bg-[#241419] text-[var(--color-danger)] hover:border-[var(--color-danger)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
});

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/integrations", label: "Integrations" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled
          ? "border-[var(--color-border)] bg-[var(--color-canvas)]/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8"
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="NexaFlow home">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">NexaFlow</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  pathname === link.href
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Start building
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-4 md:hidden"
        >
          <ul className="space-y-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" className="w-full">
                Start building
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

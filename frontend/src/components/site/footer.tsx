import Link from "next/link";
import { Logo } from "@/components/site/logo";

const GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/integrations", label: "Integrations" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs#api-reference", label: "API reference" },
      { href: "/docs#webhooks", label: "Webhooks" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-12">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-sm font-semibold tracking-tight">NexaFlow</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--color-ink-muted)]">
              Automate the work between your tools. Webhooks in, actions out, with a record of
              every run.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-xs font-semibold tracking-wide text-[var(--color-ink)] uppercase">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--color-border)] pt-6 text-[11px] text-[var(--color-ink-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NexaFlow. A portfolio project, not a commercial service.</p>
          <p className="font-mono">FastAPI · Next.js · PostgreSQL-ready</p>
        </div>
      </div>
    </footer>
  );
}

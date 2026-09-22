import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "Connect your services, build automated workflows and let NexaFlow handle repetitive tasks in the background.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NexaFlow — Automate the work between your tools",
    template: "%s · NexaFlow",
  },
  description,
  keywords: [
    "workflow automation",
    "webhooks",
    "API integration",
    "Discord automation",
    "Telegram bot",
    "developer tools",
  ],
  authors: [{ name: "NexaFlow" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "NexaFlow",
    title: "NexaFlow — Automate the work between your tools",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "NexaFlow — Automate the work between your tools",
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";

const LANGUAGES = ["curl", "python", "javascript"] as const;
type Language = (typeof LANGUAGES)[number];

const TRIGGER_SAMPLES: Record<Language, string> = {
  curl: `curl -X POST https://api.nexaflow.dev/hooks/$WORKFLOW_TOKEN \\
  -H 'Content-Type: application/json' \\
  -d '{"order_id": 1024, "customer": "Alex", "amount": 49.99}'`,
  python: `import httpx

response = httpx.post(
    f"https://api.nexaflow.dev/hooks/{WORKFLOW_TOKEN}",
    json={"order_id": 1024, "customer": "Alex", "amount": 49.99},
)
response.raise_for_status()
print(response.json()["execution_id"])`,
  javascript: `const response = await fetch(
  \`https://api.nexaflow.dev/hooks/\${workflowToken}\`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: 1024, customer: "Alex", amount: 49.99 }),
  },
);

const { execution_id } = await response.json();`,
};

const KEY_SAMPLES: Record<Language, string> = {
  curl: `curl https://api.nexaflow.dev/api/workflows \\
  -H "X-API-Key: $NEXAFLOW_KEY"`,
  python: `import httpx

workflows = httpx.get(
    "https://api.nexaflow.dev/api/workflows",
    headers={"X-API-Key": NEXAFLOW_KEY},
).json()`,
  javascript: `const workflows = await fetch("https://api.nexaflow.dev/api/workflows", {
  headers: { "X-API-Key": process.env.NEXAFLOW_KEY },
}).then((response) => response.json());`,
};

export function LanguageTabs({ variant }: { variant: "trigger" | "key" }) {
  const [language, setLanguage] = useState<Language>("curl");
  const samples = variant === "trigger" ? TRIGGER_SAMPLES : KEY_SAMPLES;

  return (
    <div>
      <div role="tablist" aria-label="Code language" className="mb-2 flex gap-1">
        {LANGUAGES.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={language === item}
            onClick={() => setLanguage(item)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs transition-colors",
              language === item
                ? "bg-[var(--color-surface-raised)] font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <CodeBlock value={samples[language]} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Braces, Check, Rocket, Send, Webhook } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { ActionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { ErrorNote } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * A five-step editor rather than a drag-and-drop canvas: a workflow here is a
 * straight line, and pretending otherwise would be decoration. Each step is a
 * form; the summary on the right is the workflow as it will be saved.
 */
const STEPS = [
  { id: 1, label: "Trigger", icon: Webhook },
  { id: 2, label: "Transform", icon: Braces },
  { id: 3, label: "Action", icon: Send },
  { id: 4, label: "Review", icon: Check },
  { id: 5, label: "Activate", icon: Rocket },
];

const ACTION_DEFAULTS: Record<ActionType, Record<string, unknown>> = {
  discord: {
    webhook_url: "",
    message_template: "New order #{{order_id}}\nCustomer: {{customer}}\nAmount: ${{amount}}",
  },
  telegram: {
    bot_token: "",
    chat_id: "",
    message_template: "New order #{{order_id}} from {{customer}}",
  },
  http: {
    method: "POST",
    url: "",
    headers_text: "{}",
    body_template: '{"order": "{{order_id}}", "total": {{amount}}}',
  },
};

const SAMPLE_PAYLOAD = '{\n  "order_id": 1024,\n  "customer": "Alex",\n  "amount": 49.99\n}';

export function WorkflowBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requireSignature, setRequireSignature] = useState(false);
  const [useTransform, setUseTransform] = useState(false);
  const [transform, setTransform] = useState('{\n  "id": "{{order_id}}",\n  "who": "{{customer}}"\n}');
  const [actionType, setActionType] = useState<ActionType>("discord");
  const [config, setConfig] = useState<Record<string, unknown>>(ACTION_DEFAULTS.discord);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: unknown) =>
    setConfig((current) => ({ ...current, [key]: value }));

  const changeAction = (next: ActionType) => {
    setActionType(next);
    setConfig(ACTION_DEFAULTS[next]);
    setError(null);
  };

  const canContinue = step === 1 ? name.trim().length > 0 : true;

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const actionConfig = { ...config };
      if (actionType === "http") {
        try {
          actionConfig.headers = JSON.parse(String(actionConfig.headers_text || "{}"));
        } catch {
          throw new ApiError(422, "invalid_headers", 'Headers must be a JSON object, e.g. {"Authorization": "Bearer …"}');
        }
        delete actionConfig.headers_text;
        if (!actionConfig.body_template) delete actionConfig.body_template;
      }

      const workflow = await api.createWorkflow({
        name,
        description: description || null,
        action_type: actionType,
        action_config: actionConfig,
        transform_template: useTransform ? transform : null,
        enabled,
        require_signature: requireSignature,
      });
      router.push(`/dashboard/workflows/${workflow.id}?created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Stepper step={step} onSelect={setStep} />

        <Card>
          <CardHeader
            title={`${step}. ${STEPS[step - 1].label}`}
            description={DESCRIPTIONS[step - 1]}
          />
          <CardBody>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {error ? <ErrorNote message={error} /> : null}

              {step === 1 ? (
                <>
                  <Field label="Workflow name" htmlFor="wf-name">
                    <Input
                      id="wf-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Order notifications"
                      maxLength={80}
                    />
                  </Field>
                  <Field label="Description" htmlFor="wf-description" hint="Optional.">
                    <Input
                      id="wf-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Shop webhook to the sales channel"
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Trigger" htmlFor="wf-trigger">
                    <Select id="wf-trigger" value="incoming_webhook" disabled>
                      <option value="incoming_webhook">Incoming webhook</option>
                    </Select>
                  </Field>
                  <Toggle
                    label="Require signed requests"
                    description="Callers must send an HMAC of the body as X-Signature-256."
                    checked={requireSignature}
                    onChange={setRequireSignature}
                  />
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Toggle
                    label="Transform the payload"
                    description="Reshape the incoming JSON before the action sees it."
                    checked={useTransform}
                    onChange={setUseTransform}
                  />
                  {useTransform ? (
                    <Field
                      label="JSON template"
                      htmlFor="wf-transform"
                      hint="Placeholders are dotted paths from the incoming payload."
                    >
                      <Textarea
                        id="wf-transform"
                        value={transform}
                        onChange={(event) => setTransform(event.target.value)}
                        rows={7}
                      />
                    </Field>
                  ) : (
                    <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                      Without a transform the action receives the incoming payload unchanged —
                      which is usually what you want when the sender already sends clean JSON.
                    </p>
                  )}
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Field label="Action" htmlFor="wf-action">
                    <Select
                      id="wf-action"
                      value={actionType}
                      onChange={(event) => changeAction(event.target.value as ActionType)}
                    >
                      <option value="discord">Discord message</option>
                      <option value="telegram">Telegram message</option>
                      <option value="http">HTTP request</option>
                    </Select>
                  </Field>

                  {actionType === "discord" ? (
                    <>
                      <Field
                        label="Discord webhook URL"
                        htmlFor="wf-discord-url"
                        hint="Server settings → Integrations → Webhooks. Stored encrypted."
                      >
                        <Input
                          id="wf-discord-url"
                          value={String(config.webhook_url ?? "")}
                          onChange={(event) => set("webhook_url", event.target.value)}
                          placeholder="https://discord.com/api/webhooks/…"
                        />
                      </Field>
                      <Field label="Message template" htmlFor="wf-discord-message">
                        <Textarea
                          id="wf-discord-message"
                          value={String(config.message_template ?? "")}
                          onChange={(event) => set("message_template", event.target.value)}
                          rows={4}
                        />
                      </Field>
                    </>
                  ) : null}

                  {actionType === "telegram" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Bot token" htmlFor="wf-tg-token" hint="Stored encrypted.">
                          <Input
                            id="wf-tg-token"
                            type="password"
                            value={String(config.bot_token ?? "")}
                            onChange={(event) => set("bot_token", event.target.value)}
                            placeholder="123456:ABC-DEF…"
                          />
                        </Field>
                        <Field label="Chat ID" htmlFor="wf-tg-chat">
                          <Input
                            id="wf-tg-chat"
                            value={String(config.chat_id ?? "")}
                            onChange={(event) => set("chat_id", event.target.value)}
                            placeholder="-1001234567890"
                          />
                        </Field>
                      </div>
                      <Field label="Message template" htmlFor="wf-tg-message">
                        <Textarea
                          id="wf-tg-message"
                          value={String(config.message_template ?? "")}
                          onChange={(event) => set("message_template", event.target.value)}
                          rows={4}
                        />
                      </Field>
                    </>
                  ) : null}

                  {actionType === "http" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                        <Field label="Method" htmlFor="wf-http-method">
                          <Select
                            id="wf-http-method"
                            value={String(config.method ?? "POST")}
                            onChange={(event) => set("method", event.target.value)}
                          >
                            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                              <option key={method}>{method}</option>
                            ))}
                          </Select>
                        </Field>
                        <Field
                          label="URL"
                          htmlFor="wf-http-url"
                          hint="Public hosts only — private addresses are refused."
                        >
                          <Input
                            id="wf-http-url"
                            value={String(config.url ?? "")}
                            onChange={(event) => set("url", event.target.value)}
                            placeholder="https://api.example.com/events"
                          />
                        </Field>
                      </div>
                      <Field label="Headers (JSON)" htmlFor="wf-http-headers" hint="Stored encrypted.">
                        <Textarea
                          id="wf-http-headers"
                          value={String(config.headers_text ?? "{}")}
                          onChange={(event) => set("headers_text", event.target.value)}
                          rows={3}
                        />
                      </Field>
                      {config.method !== "GET" && config.method !== "DELETE" ? (
                        <Field label="Body template" htmlFor="wf-http-body">
                          <Textarea
                            id="wf-http-body"
                            value={String(config.body_template ?? "")}
                            onChange={(event) => set("body_template", event.target.value)}
                            rows={4}
                          />
                        </Field>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}

              {step === 4 ? (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    This is the payload NexaFlow will use when you press Test on the workflow
                    page. The run is real: it calls the destination and is recorded like any
                    other execution.
                  </p>
                  <CodeBlock label="Sample payload" value={SAMPLE_PAYLOAD} />
                  <dl className="grid gap-2 text-xs sm:grid-cols-[9rem_1fr]">
                    <dt className="text-[var(--color-ink-subtle)]">Trigger</dt>
                    <dd>Incoming webhook{requireSignature ? ", signed" : ""}</dd>
                    <dt className="text-[var(--color-ink-subtle)]">Transform</dt>
                    <dd>{useTransform ? "JSON template" : "None — payload passes through"}</dd>
                    <dt className="text-[var(--color-ink-subtle)]">Action</dt>
                    <dd className="capitalize">{actionType}</dd>
                  </dl>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-4">
                  <Toggle
                    label="Activate immediately"
                    description="A paused workflow answers 409 until you switch it on."
                    checked={enabled}
                    onChange={setEnabled}
                  />
                  <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    On save you get the webhook URL, a ready-to-run curl command, and — if you
                    turned signing on — the signing secret, shown once.
                  </p>
                  <Button variant="primary" onClick={create} loading={saving} disabled={!name}>
                    <Rocket className="h-4 w-4" aria-hidden />
                    Create workflow
                  </Button>
                </div>
              ) : null}
            </motion.div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}>
            Back
          </Button>
          {step < 5 ? (
            <Button
              variant="secondary"
              onClick={() => setStep((value) => Math.min(5, value + 1))}
              disabled={!canContinue}
            >
              Continue
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader title="Pipeline" description="What you are building." />
        <CardBody className="space-y-2">
          <PipelineStep label="Trigger" value="Incoming webhook" active={step === 1} />
          <PipelineStep
            label="Transform"
            value={useTransform ? "JSON template" : "Skipped"}
            muted={!useTransform}
            active={step === 2}
          />
          <PipelineStep label="Action" value={actionType} active={step === 3} />
          <PipelineStep
            label="State"
            value={enabled ? "Active on save" : "Paused on save"}
            active={step === 5}
          />
        </CardBody>
      </Card>
    </div>
  );
}

const DESCRIPTIONS = [
  "Name the workflow and choose how it is triggered.",
  "Optionally reshape the incoming payload before the action runs.",
  "Pick the destination and fill in its configuration.",
  "Check what will run before anything is saved.",
  "Save it — and decide whether it starts active.",
];

function Stepper({ step, onSelect }: { step: number; onSelect: (value: number) => void }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {STEPS.map((item) => {
        const state = item.id === step ? "current" : item.id < step ? "done" : "todo";
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                state === "current" &&
                  "border-[#3b3573] bg-[var(--color-accent-soft)] text-[#c4beff]",
                state === "done" &&
                  "border-[#1f5241] bg-[#0d2119] text-[var(--color-positive)]",
                state === "todo" &&
                  "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
              )}
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function PipelineStep({
  label,
  value,
  active,
  muted,
}: {
  label: string;
  value: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 transition-colors",
        active
          ? "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]"
          : "border-[var(--color-border)]",
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">{label}</p>
      <p className={cn("mt-0.5 text-xs capitalize", muted && "text-[var(--color-ink-subtle)]")}>
        {value}
      </p>
    </div>
  );
}

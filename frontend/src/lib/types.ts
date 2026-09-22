/** Mirrors the Pydantic schemas served by the FastAPI backend. */

export interface User {
  id: number;
  email: string;
  name: string | null;
  is_demo: boolean;
  created_at: string;
}

export type ActionType = "discord" | "telegram" | "http";
export type ExecutionStatus = "success" | "failed" | "processing";

export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  trigger_type: string;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  transform_template: string | null;
  enabled: boolean;
  signature_required: boolean;
  webhook_url: string;
  created_at: string;
  updated_at: string;
  executions: number;
  last_execution_at: string | null;
  last_status: ExecutionStatus | null;
}

export interface WorkflowDetail extends Workflow {
  signing_secret: string | null;
  curl_example: string;
}

export interface Execution {
  id: number;
  workflow_id: number;
  workflow_name: string;
  action_type: ActionType;
  status: ExecutionStatus;
  attempts: number;
  is_test: boolean;
  started_at: string;
  finished_at: string | null;
  duration_us: number | null;
  duration_ms: number | null;
  trigger_payload: Record<string, unknown> | null;
  transformed_payload: Record<string, unknown> | null;
  action_result: Record<string, unknown> | null;
  error: string | null;
}

export interface ExecutionPage {
  items: Execution[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  enabled: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
  warning: string;
}

export interface Stats {
  workflows: number;
  active_workflows: number;
  executions_total: number;
  executions_today: number;
  succeeded: number;
  failed: number;
  success_rate: number | null;
  avg_duration_ms: number | null;
  series: { bucket: string; total: number; failed: number }[];
}

export interface Integration {
  type: string;
  label: string;
  description: string;
  category: string;
  status: "available" | "planned";
  secret_fields?: string[];
}

export interface IntegrationCatalogue {
  available: Integration[];
  planned: Integration[];
  counts: { available: number; planned: number };
}

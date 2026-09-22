/**
 * One fetch wrapper for the whole app.
 *
 * The session is an HttpOnly cookie, so requests only need
 * `credentials: "include"`. API keys authenticate scripts, never the browser.
 */

import type {
  ApiKey,
  CreatedApiKey,
  ExecutionPage,
  Execution,
  IntegrationCatalogue,
  Stats,
  User,
  Workflow,
  WorkflowDetail,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; fields?: { field: string; message: string }[] };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    cache: "no-store",
    ...init,
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    // The backend uses one error envelope, so one branch handles them all.
    const body = payload as ErrorBody | null;
    const fields = body?.error?.fields?.map((f) => `${f.field}: ${f.message}`).join("; ");
    throw new ApiError(
      response.status,
      body?.error?.code ?? "error",
      fields || body?.error?.message || response.statusText,
    );
  }
  return payload as T;
}

function query(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const api = {
  authConfig: () =>
    request<{ registration_enabled: boolean; environment: string }>("/api/auth/config"),
  me: () => request<User>("/api/auth/me"),
  login: (email: string, password: string) =>
    request<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name?: string) =>
    request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name: name || null }),
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),

  stats: () => request<Stats>("/api/stats"),
  integrations: () => request<IntegrationCatalogue>("/api/integrations"),

  workflows: () => request<Workflow[]>("/api/workflows"),
  workflow: (id: number) => request<WorkflowDetail>(`/api/workflows/${id}`),
  createWorkflow: (body: unknown) =>
    request<WorkflowDetail>("/api/workflows", { method: "POST", body: JSON.stringify(body) }),
  updateWorkflow: (id: number, body: unknown) =>
    request<Workflow>(`/api/workflows/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteWorkflow: (id: number) => request<void>(`/api/workflows/${id}`, { method: "DELETE" }),
  testWorkflow: (id: number, payload: Record<string, unknown>) =>
    request<{ execution_id: number; workflow: string }>(`/api/workflows/${id}/test`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    }),
  workflowExecutions: (id: number, limit = 10) =>
    request<ExecutionPage>(`/api/workflows/${id}/executions${query({ limit })}`),

  executions: (params: { limit?: number; offset?: number; status?: string; workflow_id?: number } = {}) =>
    request<ExecutionPage>(`/api/executions${query(params)}`),
  execution: (id: number) => request<Execution>(`/api/executions/${id}`),

  keys: () => request<ApiKey[]>("/api/keys"),
  createKey: (name: string) =>
    request<CreatedApiKey>("/api/keys", { method: "POST", body: JSON.stringify({ name }) }),
  revokeKey: (id: number) => request<ApiKey>(`/api/keys/${id}/revoke`, { method: "POST" }),
  deleteKey: (id: number) => request<void>(`/api/keys/${id}`, { method: "DELETE" }),
};

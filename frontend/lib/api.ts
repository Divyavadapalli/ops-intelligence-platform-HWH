import type {
  InvestigateResponse,
  DriftAnalysis,
  MemoryOverview,
  TimelineEntry,
  ServiceInfo,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || json.error || `API error ${res.status}`);
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith("API error")) throw e;
      throw new Error(`API error ${res.status}: ${text}`);
    }
  }
  return res.json();
}

export async function investigate(
  service: string,
  symptoms: string[],
  severity: string
): Promise<InvestigateResponse> {
  return fetchJSON("/api/incidents/investigate", {
    method: "POST",
    body: JSON.stringify({ service, symptoms, severity }),
  });
}

export async function submitOutcome(data: {
  incident_id: string;
  service: string;
  resolution_action: string;
  effective: boolean;
  notes: string;
}): Promise<{ status: string }> {
  return fetchJSON("/api/incidents/outcome", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMemoryOverview(
  service?: string
): Promise<MemoryOverview> {
  const q = service ? `?service=${encodeURIComponent(service)}` : "";
  return fetchJSON(`/api/memory/overview${q}`);
}

export async function getTimeline(
  service?: string
): Promise<TimelineEntry[]> {
  const q = service ? `?service=${encodeURIComponent(service)}` : "";
  return fetchJSON(`/api/memory/timeline${q}`);
}

export async function getServices(): Promise<{ services: ServiceInfo[] }> {
  return fetchJSON("/api/memory/services");
}

export async function getDriftAnalysis(
  service: string,
  errorPattern: string
): Promise<DriftAnalysis> {
  return fetchJSON(
    `/api/drift/analyze?service=${encodeURIComponent(service)}&error_pattern=${encodeURIComponent(errorPattern)}`
  );
}

export async function getAllDrift(
  refresh = false
): Promise<DriftAnalysis[]> {
  return fetchJSON(`/api/drift/all?refresh=${refresh}`);
}

export async function seedData(): Promise<{ status: string; retained: number }> {
  const res = await fetch("/api/seed", { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || json.error || `Seed error ${res.status}`);
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith("Seed error")) throw e;
      throw new Error(`Seed error ${res.status}: ${text}`);
    }
  }
  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  return fetchJSON("/api/health");
}

export interface RecalledIncident {
  text: string;
  type: string;
  score: number;
  occurred_at: string | null;
}

export interface DriftWarning {
  service: string;
  error_pattern: string;
  runbook_says: string;
  evidence_says: string;
  agreement_level: "aligned" | "partial-conflict" | "contradicts";
  drift_detected: boolean;
  confidence: string;
  recommended_update: string;
  supporting_incidents: string[];
}

export interface InvestigateResponse {
  recommendations: string;
  recalled_incidents: RecalledIncident[];
  observations: string[];
  drift_warnings: DriftWarning[];
  confidence: string;
  memory_used: boolean;
}

export interface DriftAnalysis {
  service: string;
  error_pattern: string;
  runbook_says: string;
  evidence_says: string;
  supporting_incidents: string[];
  agreement_level: "aligned" | "partial-conflict" | "contradicts";
  drift_detected: boolean;
  confidence: string;
  recommended_update: string;
  based_on: string[];
}

export interface MemoryOverview {
  observations: string[];
  incident_count: number;
  services: string[];
}

export interface TimelineEntry {
  text: string;
  type: string;
  occurred_at: string | null;
  score: number;
}

export interface ServiceInfo {
  name: string;
  role: string;
}

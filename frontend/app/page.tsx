"use client";

import { useState } from "react";
import { investigate, submitOutcome } from "@/lib/api";
import type { InvestigateResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Search,
  Zap,
} from "lucide-react";

const SERVICES = [
  "payment-service",
  "auth-gateway",
  "user-api",
  "notification-service",
  "cache-cluster",
  "order-service",
];

const SEVERITIES = ["P1", "P2", "P3", "P4"];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    P1: "bg-p1/20 text-p1 border-p1/30",
    P2: "bg-p2/20 text-p2 border-p2/30",
    P3: "bg-p3/20 text-p3 border-p3/30",
    P4: "bg-p4/20 text-p4 border-p4/30",
  };
  return (
    <Badge variant="outline" className={colors[severity] || ""}>
      {severity}
    </Badge>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    insufficient: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return (
    <Badge variant="outline" className={styles[level] || styles.low}>
      {level} confidence
    </Badge>
  );
}

export default function LiveIncidentPage() {
  const [service, setService] = useState(SERVICES[0]);
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("P1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvestigateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [outcomeSubmitted, setOutcomeSubmitted] = useState(false);
  const [outcomeAction, setOutcomeAction] = useState("");
  const [outcomeEffective, setOutcomeEffective] = useState(true);
  const [outcomeNotes, setOutcomeNotes] = useState("");

  async function handleInvestigate() {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setOutcomeSubmitted(false);
    try {
      const res = await investigate(
        service,
        symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        severity
      );
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Investigation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOutcome() {
    if (!outcomeAction.trim()) return;
    setOutcomeLoading(true);
    try {
      await submitOutcome({
        incident_id: `INC-NEW-${Date.now()}`,
        service,
        resolution_action: outcomeAction,
        effective: outcomeEffective,
        notes: outcomeNotes,
      });
      setOutcomeSubmitted(true);
    } catch {
      // silent for demo
    } finally {
      setOutcomeLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* LEFT: Form + Recommendations */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Live Incident Investigation
          </h1>
          <p className="text-muted-foreground mt-1">
            Describe the incident. Memento recalls similar past incidents and
            recommends investigation steps based on what actually worked.
          </p>
        </div>

        {/* Incident Form */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Service
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Severity
                </label>
                <div className="flex gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        severity === s
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Symptoms (comma-separated)
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., 503 errors, checkout failing, error rate > 50%"
                rows={3}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <Button
              onClick={handleInvestigate}
              disabled={loading || !symptoms.trim()}
              className="w-full bg-accent hover:bg-accent/90 text-white"
            >
              {loading ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  Searching memory...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Investigate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-5/6 bg-muted" />
              <Skeleton className="h-20 w-full bg-muted" />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="bg-red-950/30 border-red-500/30">
            <CardContent className="pt-6">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Drift Warnings */}
            {result.drift_warnings.length > 0 && (
              <Card className="bg-orange-950/20 border-orange-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-orange-400 flex items-center gap-2 text-base">
                    <AlertTriangle className="w-5 h-5" />
                    Knowledge Drift Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.drift_warnings.map((d, i) => (
                    <div key={i} className="text-sm text-orange-200/80">
                      <p>
                        <span className="font-medium">Runbook says:</span>{" "}
                        {d.runbook_says}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium">Evidence says:</span>{" "}
                        {d.evidence_says}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Observations */}
            {result.observations.length > 0 && (
              <Card className="bg-indigo-950/20 border-indigo-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-indigo-400 flex items-center gap-2 text-base">
                    <Brain className="w-5 h-5" />
                    Consolidated Observations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.observations.map((obs, i) => (
                    <p key={i} className="text-sm text-indigo-200/80">
                      {obs}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Main Recommendations */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Investigation Recommendations
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge level={result.confidence} />
                    {result.memory_used && (
                      <Badge
                        variant="outline"
                        className="bg-accent/10 text-accent border-accent/30"
                      >
                        <Brain className="w-3 h-3 mr-1" />
                        Memory-backed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {result.recommendations}
                </div>
              </CardContent>
            </Card>

            {/* Record Outcome */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Record Outcome
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outcomeSubmitted ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Outcome retained into Memento&apos;s memory. Future
                    investigations will benefit from this experience.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={outcomeAction}
                      onChange={(e) => setOutcomeAction(e.target.value)}
                      placeholder="What resolved the incident?"
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={outcomeEffective}
                          onChange={(e) =>
                            setOutcomeEffective(e.target.checked)
                          }
                          className="rounded"
                        />
                        Resolution was effective
                      </label>
                    </div>
                    <textarea
                      value={outcomeNotes}
                      onChange={(e) => setOutcomeNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      rows={2}
                      className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <Button
                      onClick={handleOutcome}
                      disabled={outcomeLoading || !outcomeAction.trim()}
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      {outcomeLoading
                        ? "Retaining..."
                        : "Record & Retain Outcome"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* RIGHT: Evidence Panel */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Recalled Evidence
        </h2>

        {!result && !loading && (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              Submit an incident to see recalled evidence from past experiences.
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-4 space-y-2">
                  <Skeleton className="h-3 w-1/3 bg-muted" />
                  <Skeleton className="h-3 w-full bg-muted" />
                  <Skeleton className="h-3 w-2/3 bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {result && result.recalled_incidents.length === 0 && (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground text-sm">
              No similar incidents found in memory. This may be a novel issue.
            </CardContent>
          </Card>
        )}

        {result &&
          result.recalled_incidents.map((inc, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={
                      inc.type === "observation"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : inc.type === "experience"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                    }
                  >
                    {inc.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    relevance: {(inc.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-6">
                  {inc.text}
                </p>
                {inc.occurred_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(inc.occurred_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}

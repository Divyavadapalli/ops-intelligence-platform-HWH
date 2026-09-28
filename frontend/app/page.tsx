"use client";

import { useState, useMemo, useEffect } from "react";
import { investigate, submitOutcome } from "@/lib/api";
import type { InvestigateResponse, RecalledIncident } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const SERVICES = [
  "payment-service",
  "auth-gateway",
  "user-api",
  "notification-service",
  "cache-cluster",
  "order-service",
];

const SEVERITIES = ["P1", "P2", "P3", "P4"] as const;

function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 0.8) return { label: "Strong match", className: "text-drift-aligned" };
  if (score >= 0.5) return { label: "Moderate match", className: "text-muted-foreground" };
  return { label: "Weak match", className: "text-muted-foreground/60" };
}

interface ParsedStep {
  number: string;
  title: string;
  detail: string;
}

function parseInvestigationSteps(text: string): { steps: ParsedStep[]; preamble: string; epilogue: string } {
  const lines = text.split("\n");
  const steps: ParsedStep[] = [];
  let preamble = "";
  let epilogue = "";
  let currentStep: ParsedStep | null = null;
  let inTable = false;
  let pastFirstStep = false;

  for (const line of lines) {
    // Detect markdown table rows
    if (line.trim().startsWith("|")) {
      inTable = true;
      // Extract table content rows (skip header/separator)
      if (line.includes("---")) continue;
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const num = cells[0].replace(/[^\d]/g, "");
        if (num && cells[1]) {
          pastFirstStep = true;
          if (currentStep) steps.push(currentStep);
          currentStep = {
            number: num,
            title: cells[1].replace(/\*\*/g, "").replace(/`/g, ""),
            detail: cells.slice(2).filter(Boolean).join(" — ").replace(/\*\*/g, "").replace(/`/g, ""),
          };
          continue;
        }
      }
      continue;
    }

    // Detect numbered list items: "1. ...", "**1.**", "| 1 |"
    const numberedMatch = line.match(/^\s*\*?\*?(\d+)\.?\*?\*?\s+(.+)/);
    if (numberedMatch && !inTable) {
      pastFirstStep = true;
      if (currentStep) steps.push(currentStep);
      const title = numberedMatch[2].replace(/\*\*/g, "").replace(/^[-–]\s*/, "");
      currentStep = { number: numberedMatch[1], title, detail: "" };
      continue;
    }

    // Continuation of current step
    if (currentStep && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
      currentStep.detail += (currentStep.detail ? " " : "") + line.trim().replace(/\*\*/g, "");
      continue;
    }

    // Section headers or separators end the current step
    if (currentStep && (line.startsWith("#") || line.startsWith("---"))) {
      steps.push(currentStep);
      currentStep = null;
      inTable = false;
    }

    // Text before first step = preamble, after = epilogue
    if (!pastFirstStep && line.trim() && !line.startsWith("#")) {
      preamble += (preamble ? " " : "") + line.trim();
    } else if (pastFirstStep && !currentStep && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
      epilogue += (epilogue ? "\n" : "") + line.trim();
    }
  }
  if (currentStep) steps.push(currentStep);

  return { steps, preamble, epilogue };
}

function InvestigationPlan({ text }: { text: string }) {
  const { steps, epilogue } = useMemo(() => parseInvestigationSteps(text), [text]);

  if (steps.length === 0) {
    // Fallback: render as plain text if parsing found no steps
    return (
      <div className="text-[13px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex gap-4 py-3 border-b border-border last:border-b-0"
        >
          <span className="text-[12px] font-mono text-muted-foreground shrink-0 w-5 text-right pt-0.5">
            {step.number}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground leading-snug">
              {step.title}
            </p>
            {step.detail && (
              <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
                {step.detail}
              </p>
            )}
          </div>
        </div>
      ))}
      {epilogue && (
        <p className="text-[12px] text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border">
          {epilogue.replace(/\*\*/g, "")}
        </p>
      )}
    </div>
  );
}

function EvidenceRow({ item, index }: { item: RecalledIncident; index: number }) {
  const { label, className } = scoreLabel(item.score);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "border-b border-border last:border-b-0 py-3 px-0",
        index === 0 && "pt-0"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              {item.type}
            </span>
            {item.occurred_at && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(item.occurred_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
          <p
            className={cn(
              "text-[13px] text-foreground/80 leading-snug",
              !expanded && "line-clamp-2"
            )}
          >
            {item.text}
          </p>
          {item.text.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-accent mt-1 hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <span className={cn("text-[11px] whitespace-nowrap shrink-0", className)}>
          {label}
        </span>
      </div>
    </div>
  );
}

function LoadingSteps() {
  const [step, setStep] = useState(0);
  const steps = [
    "Retrieving historical experience",
    "Comparing operational evidence",
    "Analysing runbook alignment",
    "Building recommendation",
  ];

  useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * 1200)
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="py-6 space-y-2.5">
      <p className="text-sm text-muted-foreground mb-4">
        Investigating incident...
      </p>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 text-[13px]">
          {i < step ? (
            <span className="text-drift-aligned text-xs">✓</span>
          ) : i === step ? (
            <span className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
          ) : (
            <span className="w-3 h-3" />
          )}
          <span
            className={cn(
              i < step
                ? "text-muted-foreground"
                : i === step
                  ? "text-foreground"
                  : "text-muted-foreground/40"
            )}
          >
            {s}
          </span>
        </div>
      ))}
    </div>
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
        symptoms.split(",").map((s) => s.trim()).filter(Boolean),
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
      /* silent for demo */
    } finally {
      setOutcomeLoading(false);
    }
  }

  const hasMemory = result && result.memory_used;
  const hasDrift = result && result.drift_warnings.length > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      {/* LEFT: Main content */}
      <div className="space-y-6 min-w-0">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Incident Investigation
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Describe the incident. Memento recalls similar past incidents and
            recommends investigation steps based on what actually worked.
          </p>
        </div>

        {/* Form */}
        <div className="border border-border rounded-lg p-5 bg-card">
          <div className="grid grid-cols-[1fr_auto] gap-5 mb-4">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Service
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-[13px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Severity
              </label>
              <div className="flex gap-1">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={cn(
                      "px-2.5 py-2 rounded text-[12px] font-medium border transition-colors",
                      severity === s
                        ? s === "P1"
                          ? "border-p1/50 text-p1 bg-p1/10"
                          : s === "P2"
                            ? "border-p2/50 text-p2 bg-p2/10"
                            : s === "P3"
                              ? "border-p3/50 text-p3 bg-p3/10"
                              : "border-p4/50 text-p4 bg-p4/10"
                        : "border-border text-muted-foreground bg-muted hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Symptoms
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="503 errors, checkout failing, error rate > 50%"
              rows={2}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
            />
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Comma-separated list of observed symptoms
            </p>
          </div>

          <Button
            onClick={handleInvestigate}
            disabled={loading || !symptoms.trim()}
            className="bg-accent hover:bg-accent/90 text-white text-[13px] h-9 px-4"
          >
            {loading ? "Investigating..." : "Investigate incident"}
          </Button>
        </div>

        {/* Loading */}
        {loading && <LoadingSteps />}

        {/* Error */}
        {error && (
          <div className="border border-p1/20 rounded-lg p-4 bg-p1/5">
            <p className="text-[13px] text-p1/90">
              Memento couldn&apos;t retrieve organisational memory.
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">{error}</p>
            <button
              onClick={handleInvestigate}
              className="text-[12px] text-accent mt-2 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Investigation
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {service}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wider",
                    severity === "P1" ? "text-p1" :
                    severity === "P2" ? "text-p2" :
                    severity === "P3" ? "text-p3" : "text-p4"
                  )}
                >
                  {severity}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                {result.confidence && result.confidence !== "insufficient" && (
                  <span className="text-muted-foreground">
                    Evidence confidence: <span className="text-foreground">{result.confidence}</span>
                  </span>
                )}
                {result.confidence === "insufficient" && (
                  <span className="text-p2">Limited historical evidence</span>
                )}
              </div>
            </div>

            {/* WHY THE RECOMMENDATION CHANGED — the key value prop */}
            {hasMemory && hasDrift && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 bg-surface-raised border-b border-border">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Why the recommendation changed
                  </h3>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-4">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Without organisational memory
                    </p>
                    <p className="text-[13px] text-foreground/70">
                      {result.drift_warnings[0]?.runbook_says || "Follow runbook as written"}
                    </p>
                  </div>
                  <div className="p-4 bg-accent/[0.03]">
                    <p className="text-[11px] font-medium text-accent uppercase tracking-wider mb-2">
                      With Memento
                    </p>
                    <p className="text-[13px] text-foreground/90">
                      {result.drift_warnings[0]?.evidence_says || "Investigation order adjusted based on evidence"}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-2.5 bg-surface-raised border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>
                    {result.recalled_incidents.length} related memories
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>
                    {result.observations.length} consolidated observations
                  </span>
                  {result.drift_warnings.length > 0 && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-p2">
                        {result.drift_warnings.length} runbook conflict{result.drift_warnings.length > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Insufficient evidence notice */}
            {result.confidence === "insufficient" && (
              <div className="border border-border rounded-lg p-4 bg-surface-raised">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-p2 mb-1">
                  Limited historical evidence
                </p>
                <p className="text-[13px] text-muted-foreground">
                  This incident does not strongly resemble anything in the current
                  memory bank. Showing general investigation guidance.
                </p>
              </div>
            )}

            {/* Drift warnings */}
            {hasDrift && (
              <div className="border border-p2/20 rounded-lg p-4 bg-p2/[0.03]">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-p2 mb-2">
                  Runbook drift detected
                </p>
                {result.drift_warnings.map((d, i) => (
                  <div key={i} className="text-[13px] space-y-1.5">
                    <div>
                      <span className="text-muted-foreground">Runbook says: </span>
                      <span className="text-foreground/80">{d.runbook_says}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Evidence says: </span>
                      <span className="text-foreground/90">{d.evidence_says}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Observations */}
            {result.observations.length > 0 && (
              <details className="group">
                <summary className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1.5">
                  <span className="transition-transform group-open:rotate-90">›</span>
                  Consolidated observations ({result.observations.length})
                </summary>
                <div className="mt-3 space-y-2 pl-3 border-l border-border">
                  {result.observations.map((obs, i) => (
                    <p key={i} className="text-[13px] text-foreground/75 leading-relaxed">
                      {obs}
                    </p>
                  ))}
                </div>
              </details>
            )}

            <Separator className="bg-border" />

            {/* Main Recommendations */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Recommended investigation plan
              </h3>
              <InvestigationPlan text={result.recommendations} />
            </div>

            <Separator className="bg-border" />

            {/* Record Outcome */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Record outcome
              </h3>
              {outcomeSubmitted ? (
                <div className="text-[13px] text-drift-aligned flex items-center gap-2">
                  <span>✓</span>
                  Outcome retained. Future investigations will benefit from this
                  experience.
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={outcomeAction}
                    onChange={(e) => setOutcomeAction(e.target.value)}
                    placeholder="What resolved the incident?"
                    className="w-full bg-muted border border-border rounded px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={outcomeEffective}
                        onChange={(e) => setOutcomeEffective(e.target.checked)}
                        className="rounded border-border"
                      />
                      Resolution was effective
                    </label>
                  </div>
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                    className="w-full bg-muted border border-border rounded px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                  />
                  <Button
                    onClick={handleOutcome}
                    disabled={outcomeLoading || !outcomeAction.trim()}
                    variant="outline"
                    className="text-[13px] h-8"
                  >
                    {outcomeLoading ? "Retaining..." : "Record outcome"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT: Evidence Panel */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
          Historical evidence
        </h2>

        {!result && !loading && (
          <div className="border border-border border-dashed rounded-lg p-6 text-center">
            <p className="text-[13px] text-muted-foreground">
              Submit an incident to see recalled evidence from past operations.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2 py-3 border-b border-border last:border-b-0">
                <div className="h-2.5 w-20 bg-muted rounded" />
                <div className="h-2.5 w-full bg-muted rounded" />
                <div className="h-2.5 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {result && result.recalled_incidents.length === 0 && (
          <div className="border border-border border-dashed rounded-lg p-6 text-center">
            <p className="text-[12px] font-semibold text-p2 uppercase tracking-wider mb-1">
              No matching organisational memory
            </p>
            <p className="text-[13px] text-muted-foreground">
              This incident does not strongly resemble anything in the current memory bank.
            </p>
          </div>
        )}

        {result && result.recalled_incidents.length > 0 && (
          <div className="max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin pr-1">
            {result.recalled_incidents.map((inc, i) => (
              <EvidenceRow key={i} item={inc} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

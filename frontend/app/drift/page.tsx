"use client";

import { useEffect, useState } from "react";
import { getAllDrift, seedData } from "@/lib/api";
import type { DriftAnalysis } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function cleanEvidence(raw: string): string {
  // Extract all text='...' values from ReflectFact structures
  const textMatches: string[] = [];
  const textPattern = /text='([^']+)'/g;
  let match;
  while ((match = textPattern.exec(raw)) !== null) {
    textMatches.push(match[1]);
  }
  if (textMatches.length > 0) {
    return textMatches.join(" ");
  }

  // If it's a tuple like ('memories', []) or ('directives', [])
  const tupleEmpty = raw.match(/^\('(\w+)',\s*\[\]\)$/);
  if (tupleEmpty) return "";

  // Strip ReflectFact wrapper if simple
  let s = raw;
  const reflectMatch = s.match(/^ReflectFact\(([\s\S]*)\)$/);
  if (reflectMatch) s = reflectMatch[1];
  // Strip UUIDs
  s = s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "");
  // Strip internal keys
  s = s.replace(/\b(id|context|document_id|metadata|bank_id|tags|source|type)='[^']*'/gi, "");
  s = s.replace(/,\s*,/g, ",").replace(/,\s*$/g, "").replace(/\s{2,}/g, " ").trim();
  if (s.length < 5) return "";
  return s;
}

function AgreementIndicator({ level }: { level: string }) {
  const config: Record<string, { label: string; color: string }> = {
    contradicts: { label: "Contradicts", color: "text-p1" },
    "partial-conflict": { label: "Partial conflict", color: "text-p2" },
    aligned: { label: "Aligned", color: "text-drift-aligned" },
  };
  const c = config[level] || config.aligned;
  return (
    <span className={cn("text-[11px] font-semibold uppercase tracking-wider", c.color)}>
      {c.label}
    </span>
  );
}

function DriftRow({ drift }: { drift: DriftAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  const borderAccent =
    drift.agreement_level === "contradicts"
      ? "border-l-p1"
      : drift.agreement_level === "partial-conflict"
        ? "border-l-p2"
        : "border-l-drift-aligned";

  return (
    <div
      className={cn(
        "border border-border rounded-lg overflow-hidden border-l-2",
        borderAccent
      )}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-surface-raised/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <span className="font-mono text-[13px] text-foreground">
              {drift.service}
            </span>
            <span className="text-muted-foreground/40 mx-2">·</span>
            <span className="text-[13px] text-muted-foreground">
              {drift.error_pattern}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {drift.confidence && (
            <span className="text-[11px] text-muted-foreground">
              {drift.confidence} confidence
            </span>
          )}
          <AgreementIndicator level={drift.agreement_level} />
          <span className="text-muted-foreground/50 text-xs transition-transform" style={{ transform: expanded ? "rotate(90deg)" : "none" }}>
            ›
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border">
          {/* Two-column comparison */}
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Runbook guidance
              </p>
              <p className="text-[13px] text-foreground/80 leading-relaxed">
                {drift.runbook_says}
              </p>
            </div>
            <div className="p-5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Operational evidence
              </p>
              <p className="text-[13px] text-foreground/90 leading-relaxed">
                {drift.evidence_says}
              </p>
            </div>
          </div>

          {/* Recommended update */}
          {drift.drift_detected && drift.recommended_update && (
            <div className="border-t border-border px-5 py-3.5 bg-surface-raised/50">
              <p className="text-[11px] font-medium text-accent uppercase tracking-wider mb-1">
                Recommended update
              </p>
              <p className="text-[13px] text-foreground/80 leading-relaxed">
                {drift.recommended_update}
              </p>
            </div>
          )}

          {/* Supporting evidence */}
          {(drift.supporting_incidents.length > 0 || (drift.based_on && drift.based_on.length > 0)) && (
            <div className="border-t border-border px-5 py-3 bg-muted/30">
              <div className="flex items-center gap-6 text-[11px] text-muted-foreground">
                {drift.supporting_incidents.length > 0 && (
                  <span>
                    Evidence from:{" "}
                    <span className="font-mono text-foreground/60">
                      {drift.supporting_incidents.join(", ")}
                    </span>
                  </span>
                )}
              </div>

              {drift.based_on && drift.based_on.length > 0 && (() => {
                const cleaned = drift.based_on.map(cleanEvidence).filter(Boolean);
                if (cleaned.length === 0) return null;
                return (
                  <details className="mt-2">
                    <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                      Source memories ({cleaned.length})
                    </summary>
                    <div className="mt-2 space-y-1.5 pl-3 border-l border-border">
                      {cleaned.slice(0, 5).map((fact, i) => (
                        <p key={i} className="text-[12px] text-muted-foreground leading-relaxed">
                          {fact}
                        </p>
                      ))}
                      {cleaned.length > 5 && (
                        <p className="text-[11px] text-muted-foreground/60 italic">
                          and {cleaned.length - 5} more
                        </p>
                      )}
                    </div>
                  </details>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeDriftPage() {
  const [drifts, setDrifts] = useState<DriftAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getAllDrift(refresh);
      setDrifts(data);
    } catch (firstErr: unknown) {
      // Retry once on transient failures (truncated JSON, network hiccup)
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const data = await getAllDrift(refresh);
        setDrifts(data);
      } catch {
        // Only show error if we have no valid data already
        if (drifts.length === 0) {
          const msg = firstErr instanceof Error ? firstErr.message : "Failed to load drift analysis";
          setError(
            msg.includes("JSON") || msg.includes("Unexpected")
              ? "Drift analysis temporarily unavailable. Try again."
              : msg
          );
        }
        // If we already have valid drift data, silently keep it
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedData();
      await new Promise((r) => setTimeout(r, 3000));
      await load(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Seeding failed");
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const driftCount = drifts.filter((d) => d.drift_detected).length;
  const alignedCount = drifts.filter(
    (d) => d.agreement_level === "aligned"
  ).length;

  const sorted = [...drifts].sort((a, b) => {
    const order: Record<string, number> = {
      contradicts: 0,
      "partial-conflict": 1,
      aligned: 2,
    };
    return (order[a.agreement_level] ?? 2) - (order[b.agreement_level] ?? 2);
  });

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Knowledge Drift
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Conflicts between documented runbook guidance and accumulated
            operational evidence.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={seeding}
            className="text-[13px] h-8 border-border text-muted-foreground hover:text-foreground"
          >
            {seeding ? "Seeding..." : "Seed data"}
          </Button>
          <Button
            variant="outline"
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-[13px] h-8 border-border text-muted-foreground hover:text-foreground"
          >
            {refreshing ? "Analysing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && drifts.length > 0 && (
        <div className="flex items-center gap-6 py-3 px-5 border border-border rounded-lg bg-card text-[13px]">
          <div>
            <span className="text-muted-foreground">Runbooks analysed</span>
            <span className="ml-2 font-semibold text-foreground">{drifts.length}</span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-border" />
          {driftCount > 0 && (
            <>
              <div>
                <span className="text-muted-foreground">Drift detected</span>
                <span className="ml-2 font-semibold text-p1">{driftCount}</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-border" />
            </>
          )}
          <div>
            <span className="text-muted-foreground">Aligned</span>
            <span className="ml-2 font-semibold text-drift-aligned">{alignedCount}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-p1/20 rounded-lg p-4 bg-p1/5">
          <p className="text-[13px] text-p1/90">
            Drift analysis could not be completed.
          </p>
          <p className="text-[12px] text-muted-foreground mt-1">{error}</p>
          <button
            onClick={() => load(true)}
            className="text-[12px] text-accent mt-2 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <p className="text-[13px] text-muted-foreground">
            Comparing runbook guidance against operational evidence...
          </p>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border rounded-lg p-5 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-48 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-muted rounded" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drift rows */}
      {!loading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((d, i) => (
            <DriftRow key={i} drift={d} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && drifts.length === 0 && !error && (
        <div className="border border-border border-dashed rounded-lg py-12 text-center">
          <p className="text-[13px] text-muted-foreground mb-1">
            No drift analysis available.
          </p>
          <p className="text-[12px] text-muted-foreground/60">
            Seed incident data and runbooks, then refresh to compare guidance
            against operational evidence.
          </p>
        </div>
      )}
    </div>
  );
}

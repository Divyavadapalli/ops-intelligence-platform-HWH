"use client";

import { useEffect, useState } from "react";
import { getAllDrift, seedData } from "@/lib/api";
import type { DriftAnalysis } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  Shield,
  Database,
} from "lucide-react";

function AgreementBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; className: string }> = {
    contradicts: {
      label: "Contradicts",
      className: "bg-drift-contradicts/20 text-red-400 border-drift-contradicts/30",
    },
    "partial-conflict": {
      label: "Partial Conflict",
      className: "bg-drift-partial/20 text-orange-400 border-drift-partial/30",
    },
    aligned: {
      label: "Aligned",
      className: "bg-drift-aligned/20 text-green-400 border-drift-aligned/30",
    },
  };
  const c = config[level] || config.aligned;
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

function DriftCard({ drift }: { drift: DriftAnalysis }) {
  const borderColor =
    drift.agreement_level === "contradicts"
      ? "border-red-500/30"
      : drift.agreement_level === "partial-conflict"
        ? "border-orange-500/30"
        : "border-green-500/30";

  const bgColor =
    drift.agreement_level === "contradicts"
      ? "bg-red-950/10"
      : drift.agreement_level === "partial-conflict"
        ? "bg-orange-950/10"
        : "bg-green-950/10";

  return (
    <Card className={`${bgColor} ${borderColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {drift.service}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {drift.error_pattern}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AgreementBadge level={drift.agreement_level} />
            <Badge
              variant="outline"
              className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
            >
              {drift.confidence}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Runbook Says */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield className="w-4 h-4" />
              Runbook Says
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80 leading-relaxed">
              {drift.runbook_says}
            </div>
          </div>

          {/* Evidence Shows */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Database className="w-4 h-4" />
              Evidence Shows
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80 leading-relaxed">
              {drift.evidence_says}
            </div>
          </div>
        </div>

        {drift.drift_detected && drift.recommended_update && (
          <>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <ArrowRight className="w-4 h-4" />
                Recommended Update
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {drift.recommended_update}
              </p>
            </div>
          </>
        )}

        {drift.supporting_incidents.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Evidence from:</span>
            {drift.supporting_incidents.map((inc, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-xs bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
              >
                {inc}
              </Badge>
            ))}
          </div>
        )}

        {drift.based_on && drift.based_on.length > 0 && (
          <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
              View source memories ({drift.based_on.length})
            </summary>
            <div className="mt-2 space-y-1 pl-4 border-l border-border">
              {drift.based_on.slice(0, 5).map((fact, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed">
                  {fact}
                </p>
              ))}
              {drift.based_on.length > 5 && (
                <p className="text-muted-foreground italic">
                  ...and {drift.based_on.length - 5} more
                </p>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load drift analysis");
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-accent" />
            Knowledge Drift
          </h1>
          <p className="text-muted-foreground mt-1">
            Detect when runbook guidance conflicts with accumulated evidence
            from past incidents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Database className="w-4 h-4 mr-1" />
            {seeding ? "Seeding..." : "Seed Data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && drifts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {drifts.length}
              </p>
              <p className="text-sm text-muted-foreground">Runbooks analyzed</p>
            </CardContent>
          </Card>
          <Card className="bg-red-950/10 border-red-500/20">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-red-400">{driftCount}</p>
              <p className="text-sm text-muted-foreground">Drift detected</p>
            </CardContent>
          </Card>
          <Card className="bg-green-950/10 border-green-500/20">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-400">
                {alignedCount}
              </p>
              <p className="text-sm text-muted-foreground">
                Confirmed aligned
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="bg-red-950/30 border-red-500/30">
          <CardContent className="pt-6">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40 bg-muted" />
                  <Skeleton className="h-5 w-24 bg-muted" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 bg-muted rounded-lg" />
                  <Skeleton className="h-20 bg-muted rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drift Cards — drift detected first */}
      {!loading && drifts.length > 0 && (
        <div className="space-y-4">
          {drifts
            .sort((a, b) => {
              const order: Record<string, number> = { contradicts: 0, "partial-conflict": 1, aligned: 2 };
              return (order[a.agreement_level] ?? 2) - (order[b.agreement_level] ?? 2);
            })
            .map((d, i) => (
              <DriftCard key={i} drift={d} />
            ))}
        </div>
      )}

      {!loading && drifts.length === 0 && !error && (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">
              No drift analysis available yet. Click &quot;Seed Data&quot; to
              load incidents and runbooks, then &quot;Refresh&quot; to analyze.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

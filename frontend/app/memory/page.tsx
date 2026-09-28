"use client";

import { useEffect, useState } from "react";
import { getMemoryOverview, getTimeline } from "@/lib/api";
import type { MemoryOverview, TimelineEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Database, Layers, Clock } from "lucide-react";

const ALL_SERVICES = [
  "all",
  "payment-service",
  "auth-gateway",
  "user-api",
  "notification-service",
  "cache-cluster",
  "order-service",
];

export default function MemoryExplorerPage() {
  const [selectedService, setSelectedService] = useState("all");
  const [overview, setOverview] = useState<MemoryOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
        return fn();
      }
    }

    async function load() {
      setLoading(true);
      setError(null);
      const svc = selectedService === "all" ? undefined : selectedService;

      const [ovResult, tlResult] = await Promise.allSettled([
        withRetry(() => getMemoryOverview(svc)),
        withRetry(() => getTimeline(svc)),
      ]);

      if (ovResult.status === "fulfilled") {
        setOverview(ovResult.value);
      }
      if (tlResult.status === "fulfilled") {
        setTimeline(tlResult.value);
      }

      const failures = [ovResult, tlResult].filter(
        (r) => r.status === "rejected"
      );
      if (failures.length > 0) {
        setError("Some data failed to load — try refreshing the page");
      }

      setLoading(false);
    }
    load();
  }, [selectedService]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-accent" />
          Memory Explorer
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse Memento&apos;s accumulated knowledge — observations, incident
          patterns, and service history.
        </p>
      </div>

      {/* Service Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {ALL_SERVICES.map((svc) => (
          <button
            key={svc}
            onClick={() => setSelectedService(svc)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              selectedService === svc
                ? "bg-accent/20 border-accent text-accent"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {svc === "all" ? "All Services" : svc}
          </button>
        ))}
      </div>

      {error && (
        <Card className="bg-red-950/30 border-red-500/30">
          <CardContent className="pt-6">
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 bg-muted mb-2" />
                <Skeleton className="h-4 w-24 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Database className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {overview.incident_count}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Memories recalled
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Layers className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {overview.observations.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Observations formed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Brain className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {overview.services.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Services tracked
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Observations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Auto-Consolidated Observations
          </h2>
          <p className="text-xs text-muted-foreground">
            Hindsight automatically consolidates patterns across incidents into
            evidence-backed beliefs.
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="pt-4 space-y-2">
                    <Skeleton className="h-3 w-full bg-muted" />
                    <Skeleton className="h-3 w-3/4 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : overview && overview.observations.length > 0 ? (
            <div className="space-y-3">
              {overview.observations.map((obs, i) => (
                <Card
                  key={i}
                  className="bg-indigo-950/10 border-indigo-500/20"
                >
                  <CardContent className="pt-4">
                    <p className="text-sm text-indigo-200/80 leading-relaxed">
                      {obs}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                No observations yet. Seed incidents to let Hindsight form
                patterns.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Incident Timeline
          </h2>
          <p className="text-xs text-muted-foreground">
            Memories from past incidents, ordered by relevance.
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="pt-4 space-y-2">
                    <Skeleton className="h-3 w-1/4 bg-muted" />
                    <Skeleton className="h-3 w-full bg-muted" />
                    <Skeleton className="h-3 w-2/3 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : timeline.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
              {timeline.map((entry, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={
                          entry.type === "observation"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : entry.type === "experience"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                        }
                      >
                        {entry.type}
                      </Badge>
                      {entry.occurred_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.occurred_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                      {entry.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                No incidents in memory yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

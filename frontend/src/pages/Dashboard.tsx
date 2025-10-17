import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

import StatCard from "../components/StatCard";
import Sparkline from "../components/Sparkline";
import HeatmapPlaceholder from "../components/HeatmapPlaceholder";
import FiltersBar, { type Filters as FiltersType } from "../components/FiltersBar";

import { getMetrics, type Metrics } from "../data/metrics";

export default function Dashboard() {
  const { accessToken } = useAuth();
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const defaultFilters: FiltersType = { location: "all", range: "24h" };

  const [filters, setFilters] = useState<FiltersType>(() => ({
    location:
      (searchParams.get("location") as FiltersType["location"]) ||
      defaultFilters.location,
    range:
      (searchParams.get("range") as FiltersType["range"]) ||
      defaultFilters.range,
  }));

  // Keep URL in sync with current filters (so refresh/share keeps state)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("location", filters.location);
    next.set("range", filters.range);
    setSearchParams(next, { replace: true });
  }, [filters]);

  // Fetch metrics whenever auth or filters change
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    (async () => {
      try {
        const data = await getMetrics({
          location: filters.location,
          range: filters.range,
        });
        setM(data);
        setErr(null);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error ||
            e?.message ||
            "Failed to load metrics"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, filters]);

  // Points for the sparkline (safe even if series missing)
  const points = useMemo(
    () => (m?.series ? m.series.map((s) => s.count) : []),
    [m]
  );

  return (
    <>
      {err && <div className="text-rose-600 mb-4">{err}</div>}

      <FiltersBar
        value={filters}
        onChange={setFilters}
        resetTo={defaultFilters}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Count"
          value={m?.kpis.currentCount ?? "—"}
          delta={m?.kpis.changePct}
          hint="vs previous reading"
        />
        <StatCard
          label="Active Locations"
          value={m?.kpis.activeLocations ?? "—"}
          hint="reporting today"
        />
        <StatCard
          label="Online Nodes"
          value={m?.kpis.onlineNodes ?? "—"}
          hint="device health"
        />

        <div className="rounded-2xl bg-white p-4 shadow-sm border">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {filters.range === "24h"
              ? "Last 24h"
              : filters.range === "7d"
              ? "Last 7 days"
              : "Last 30 days"}
          </div>
          <div className="mt-2">
            {loading ? (
              <div className="h-20 animate-pulse bg-slate-100 rounded" />
            ) : (
              <Sparkline points={points} />
            )}
            {!loading && points.length === 0 && (
              <div className="text-slate-500 text-xs mt-1">No series data</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 rounded-2xl bg-white p-4 shadow-sm border">
          <div className="mb-3 text-sm text-slate-600">
            Utilisation heatmap (demo)
          </div>
          {loading ? (
            <div className="h-64 animate-pulse bg-slate-100 rounded" />
          ) : m?.heatmap ? (
            <HeatmapPlaceholder
              rows={m.heatmap.rows}
              cols={m.heatmap.cols}
              values={m.heatmap.grid}
            />
          ) : (
            <div className="text-slate-500 text-sm">No heatmap data</div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border">
          <div className="mb-3 text-sm text-slate-600">Debug (KPIs)</div>
          {m ? (
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(m.kpis, null, 2)}
            </pre>
          ) : (
            <div className="text-slate-500 text-sm">No data</div>
          )}
        </div>
      </div>
    </>
  );
};


import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

import FiltersBar, { type Filters as FiltersType } from "../components/FiltersBar";
import PowerBIReport from "../components/PowerBIReport";
import StatCard from "../components/StatCard";

import {
  fetchNodesSummary,
  fetchNodesAll,
  fetchLocationsAll,
  type NodesSummary,
  type NodeDto,
  type LocationDto,
} from "../auth/api";

// helpers & constants
function msSince(d: Date | string | number | null | undefined) {
  if (!d) return Infinity;
  const t = typeof d === "number" ? d : new Date(d as any).getTime();
  return Number.isFinite(t) ? Date.now() - t : Infinity;
}

// Heuristic column names from your PeopleByLocation page (adjust if needed)
const PEOPLE_COL = "People";
const LOCATION_COL = "LocationName";

type Range = "24h" | "7d" | "30d";

// component
export default function Dashboard() {
  const { user } = useAuth();

  // URL-backed filters
  const [sp, setSp] = useSearchParams();
  const [filters, setFilters] = useState<FiltersType>({
    location: sp.get("location") || "all",
    range: (sp.get("range") as Range) || "24h",
  });
  useEffect(() => {
    setSp({ location: filters.location, range: filters.range });
  }, [filters, setSp]);

  const [summary, setSummary] = useState<NodesSummary | null>(null);
  const [nodes, setNodes] = useState<NodeDto[]>([]);
  const [locs, setLocs] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // From Power BI export: top location by people now
  const [topPeopleLoc, setTopPeopleLoc] = useState<{ name: string; count: number } | null>(null);

  function pickTopFromRows(rows: Record<string, any>[]) {
    let best: { name: string; count: number } | null = null;
    for (const r of rows) {
      const name =
        (r[LOCATION_COL] ??
          r["Location"] ??
          r["Location Name"] ??
          r["DimLocation.LocationName"]) as string;
      const raw = r[PEOPLE_COL] ?? r["People Count"] ?? r["Count"] ?? r["Persons"];
      const count = Number(String(raw).replace(/[, ]/g, "")); // handle "1,234"
      if (!name || !Number.isFinite(count)) continue;
      if (!best || count > best.count) best = { name, count };
    }
    return best;
  }

  // Load all needed data for KPIs
  async function loadAll() {
    try {
      setErr(null);
      setLoading(true);
      const [s, ns, ls] = await Promise.all([
        fetchNodesSummary(),
        fetchNodesAll(),
        fetchLocationsAll(),
      ]);
      setSummary(s);
      setNodes(ns);
      setLocs(ls);
    } catch (e: any) {
      console.error("[dashboard] load error:", e);
      setErr(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadAll();
  }, []);

  // Filtered nodes by selected location
  const nodesFiltered = useMemo(() => {
    if (filters.location === "all") return nodes;
    return nodes.filter((n) => String(n.location_id || "") === filters.location);
  }, [nodes, filters.location]);

  const onlineNow = useMemo(
    () => nodesFiltered.filter((n) => n.status === "online"),
    [nodesFiltered]
  );



  const locationOptions = useMemo(
  () =>
    locs
      .map((l) => ({
        id: String((l as any)._id || ""),
        label: [l.name, l.building, l.level, l.room]
          .filter(Boolean)
          .join(" · ") || l.name || "Unnamed",
      }))
      .filter((o) => o.id),
  [locs]
);



  // Coverage across locations (active locations / total)
  const coverage = useMemo(() => {
    const totalLoc =
      filters.location === "all"
        ? locs.length
        : locs.filter((l) => String((l as any)._id || "") === filters.location).length || 1;





    const activeLocIds = new Set<string>();
    for (const n of onlineNow) if (n.location_id) activeLocIds.add(String(n.location_id));
    const active =
      filters.location === "all" ? activeLocIds.size : Math.min(activeLocIds.size, totalLoc);

    const pct = totalLoc ? Math.round((active / totalLoc) * 100) : 0;
    return { pct, active, total: totalLoc };
  }, [onlineNow, locs, filters.location]);

  const windowMin = summary?.windowMin ?? 10;

  // Active location names
  const activeLocationNames = useMemo(() => {
    const ids = new Set<string>();
    for (const n of onlineNow) if (n.location_id) ids.add(String(n.location_id));
    const byId = new Map<string, LocationDto>();
    for (const l of locs) byId.set(String((l as any)._id || ""), l);
    const names = [...ids].map((id) => prettyLoc(byId.get(id))).filter(Boolean) as string[];
    return names.sort();
  }, [onlineNow, locs]);

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex items-end justify-between mt-1">
        <div>
          <h2 className="font-heading text-2xl text-brick">Dashboard</h2>
          <p className="text-slate-500 text-sm">
            {user?.name ? `Welcome, ${user.name}.` : "Welcome."}
          </p>
        </div>
      </div>

      {/* FiltersBar – drives both KPIs and PowerBI */}
      <section className="rounded-2xl bg-white p-3 md:p-4 border shadow-sm">
        <FiltersBar
          value={filters}
          onChange={setFilters}
          resetTo={{ location: "all", range: "24h" }}
          locations={locationOptions}
          />

      </section>

      {/* KPI row*/}
      <section>
        {err && <div className="text-rose-600 text-sm mb-2">{err}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Active locations – names */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-[11px] tracking-wide text-slate-500">ACTIVE LOCATIONS</div>
            {loading ? (
              <div className="h-16 rounded bg-slate-100 mt-2 animate-pulse" />
            ) : activeLocationNames.length ? (
              <ul className="mt-2 text-sm text-slate-700 space-y-1">
                {activeLocationNames.slice(0, 6).map((n) => (
                  <li key={n}>• {n}</li>
                ))}
                {activeLocationNames.length > 6 && (
                  <li className="text-xs text-slate-500">
                    +{activeLocationNames.length - 6} more
                  </li>
                )}
              </ul>
            ) : (
              <div className="mt-1 text-slate-400 text-sm">No active locations</div>
            )}
            <div className="text-xs text-slate-400 mt-2">reporting now</div>
          </div>

          {/* Online nodes */}
          <StatCard
            label="ONLINE NODES"
            value={`${
              onlineNow.length
            }/${filters.location === "all" ? summary?.total ?? nodes.length : nodesFiltered.length}`}
            sub={`window ${windowMin} min`}
          />

          {/* Coverage */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-[11px] tracking-wide text-slate-500">COVERAGE</div>
            <div className="text-2xl font-semibold mt-1">{coverage.pct}%</div>
            <div className="text-xs text-slate-400 mt-1">
              {coverage.active} active / {coverage.total} locations
            </div>
          </div>

          {/* Location with most people */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-[11px] tracking-wide text-slate-500">
              LOCATION WITH MOST PEOPLE (NOW)
            </div>
            {topPeopleLoc ? (
              <>
                <div className="text-base font-medium mt-1 text-slate-800">
                  {topPeopleLoc.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {topPeopleLoc.count.toLocaleString()} people
                </div>
              </>
            ) : (
              <div className="text-slate-400 mt-1 text-sm">awaiting Power BI…</div>
            )}
          </div>
        </div>
      </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Heatmap */}
  <div className="rounded-xl bg-white border shadow-sm p-3 min-h-[520px]">
    <div className="mb-2">
      <h3 className="text-sm font-medium text-slate-700">Heatmap</h3>
      <p className="text-[11px] text-slate-400">

      </p>
    </div>
    <PowerBIReport pageName="Heatmap" height={460} className="rounded-lg" />
  </div>

  {/* People by location */}
  <div className="rounded-xl bg-white border shadow-sm p-3 min-h-[520px]">
    <div className="mb-2">
      <h3 className="text-sm font-medium text-slate-700">Total Number of People by Day and Location</h3>
      <p className="text-[11px] text-slate-400">

      </p>
    </div>
    <PowerBIReport pageName="Stackbar" height={460} className="rounded-lg" />
  </div>
</section>


    </div>
  );
}

// helpers
function prettyLoc(l?: LocationDto) {
  if (!l) return "";
  const bits = [l.name, l.building, l.level, l.room].filter(Boolean);
  return bits.join(" · ");
}

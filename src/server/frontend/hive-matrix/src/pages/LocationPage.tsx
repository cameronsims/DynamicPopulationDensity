import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchLocationsAll,
  deleteLocation,
  type LocationDto,
} from "../auth/api";
import AddLocationModel from "../components/AddLocationModel";
import PowerBIReport from "../components/PowerBIReport";
import type { PbiFilters } from "../components/PowerBIReport";

type Range = "24h" | "7d" | "30d";

export default function LocationPage() {
  const [locs, setLocs] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openLoc, setOpenLoc] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [sp, setSp] = useSearchParams();
  const defaultLoc = "all";
  const defaultRange: Range = "24h";

  const [location, setLocation] = useState<string>(() => sp.get("location") || defaultLoc);
  const [range, setRange] = useState<Range>(() => (sp.get("range") as Range) || defaultRange);

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const all = await fetchLocationsAll();
      setLocs(all);
    } catch (e: any) {
      setErr(e?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function apply() {
    const next = new URLSearchParams(sp);
    next.set("location", location);
    next.set("range", range);
    setSp(next, { replace: true });
  }

  function reset() {
    setLocation(defaultLoc);
    setRange(defaultRange);
    const next = new URLSearchParams(sp);
    next.set("location", defaultLoc);
    next.set("range", defaultRange);
    setSp(next, { replace: true });
  }

  // app-level filters for PowerBI
  const pbiFilters: PbiFilters = useMemo(() => ({ location, range }), [location, range]);

  const selectedLocName =
    location === "all"
      ? "All locations"
      : locs.find((l) => String(l._id) === String(location))?.name ?? "—";

  // table rows depending on the location filter
  const tableRows = useMemo(() => {
    if (location === "all") return locs;
    return locs.filter((l) => String(l._id) === String(location));
  }, [locs, location]);

  async function handleDelete(id: string) {
    try {
      setBusyId(id);
      await deleteLocation(id);
      if (location !== "all" && String(location) === String(id)) {
        setLocation("all");
        const next = new URLSearchParams(sp);
        next.set("location", "all");
        setSp(next, { replace: true });
      }
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Failed to delete location");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Location</h1>
        <button
          onClick={() => setOpenLoc(true)}
          className="rounded-lg bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
        >
          + Add Location
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3">
        <div>
          <div className="text-xs text-slate-600 mb-1">Location</div>
          <select
            className="border rounded-lg px-3 py-2 bg-white"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="all">All</option>
            {locs.map((l) => (
              <option key={String(l._id)} value={String(l._id)}>
                {l.name || `Loc ${l._id}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-slate-600 mb-1">Date range</div>
          <select
            className="border rounded-lg px-3 py-2 bg-white"
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        <button
          onClick={apply}
          className="h-10 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Apply
        </button>
        <button
          onClick={reset}
          className="h-10 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Reset
        </button>
      </div>

      {err && <div className="text-rose-600">{err}</div>}
      {loading && <div className="h-20 animate-pulse bg-slate-100 rounded" />}

      {/* Content */}
      {!loading && !err && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm border min-h-[360px]">
            <div className="mb-2 text-sm text-slate-600">Line Chart (Total number of people by day and nodeid)</div>
            <PowerBIReport pageName="Linechart" filters={pbiFilters} height={420} />
          </div>

          {/* Locations table with Delete */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border min-h-[360px]">
            <div className="mb-2 text-sm text-slate-600">Locations</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Building / Level / Room</th>
                  <th className="py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No locations
                    </td>
                  </tr>
                )}
                {tableRows.map((l) => {
                  const id = String((l as any)._id || "");
                  return (
                    <tr key={id} className="border-t">
                      <td className="py-2 pr-2">{l.name || `Loc ${id}`}</td>
                      <td className="py-2 pr-2">
                        {[l.building, l.level, l.room].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => setConfirmId(id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                          disabled={busyId === id}
                        >
                          {busyId === id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-xs text-slate-400 mt-2">
              {location === "all"
                ? `Showing ${tableRows.length} of ${locs.length} locations`
                : `Filtered to 1 location: ${selectedLocName}`}
            </div>
          </div>
        </div>
      )}

      {/* Add Location model */}
      <AddLocationModel
        open={openLoc}
        onClose={() => setOpenLoc(false)}
        onCreated={async () => {
          try {
            await reload();
          } catch {
            /* noop */
          }
        }}
      />

      {/* Confirm delete model */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-4 w-[360px] shadow">
            <div className="font-semibold mb-1">Delete location?</div>
            <p className="text-sm text-slate-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-300"
                onClick={() => setConfirmId(null)}
                disabled={busyId === confirmId}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                onClick={() => handleDelete(confirmId)}
                disabled={busyId === confirmId}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

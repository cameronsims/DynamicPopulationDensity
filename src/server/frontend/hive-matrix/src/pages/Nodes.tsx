import { useEffect, useState } from "react";
import {
  fetchNodesAll,
  fetchLocationsAll,
  deleteNode,
  type NodeDto,
  type LocationDto,
} from "../auth/api";
import AddNodeModel from "../components/AddNodeModel";

export default function NodesPage() {
  const [rows, setRows] = useState<NodeDto[]>([]);
  const [locs, setLocs] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [nodes, locations] = await Promise.all([
        fetchNodesAll(),
        fetchLocationsAll(),
      ]);
      setRows(nodes);
      setLocs(locations);
    } catch (e: any) {
      setErr(e?.message || "Failed to load nodes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function locName(id?: string | null) {
    if (!id) return "—";
    return locs.find((l) => String(l._id) === String(id))?.name || "—";
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete node "${name}"?`)) return;
    try {
      setDeletingId(id);
      await deleteNode(id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nodes</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
        >
          + Add Node
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm border">
        {loading && <div className="h-24 animate-pulse bg-slate-100 rounded" />}
        {err && <div className="text-rose-600 text-sm">{err}</div>}

        {!loading && !err && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">IP</th>
                  <th className="py-2 pr-4">MAC</th>
                  <th className="py-2 pr-4">Model</th>
                  <th className="py-2 pr-4">Brand</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-4">{r.ip_address}</td>
                    <td className="py-2 pr-4">{r.mac_address}</td>
                    <td className="py-2 pr-4">{r.model || "—"}</td>
                    <td className="py-2 pr-4">{r.brand || "—"}</td>
                    <td className="py-2 pr-4">{locName(r.location_id as any)}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          r.status === "online"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.status || "offline"}
                      </span>
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <button
                        disabled={deletingId === r._id}
                        onClick={() => handleDelete(r._id, r.name)}
                        className="px-2 py-1 rounded border text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        title="Delete node"
                      >
                        {deletingId === r._id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={8}>
                      No nodes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* put the modal back in */}
      <AddNodeModel
        open={open}
        onClose={() => setOpen(false)}
        onCreated={load}
      />
    </div>
  );
}

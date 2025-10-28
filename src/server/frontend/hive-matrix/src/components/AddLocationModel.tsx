import { useState } from "react";
import { createLocation, type CreateLocationInput } from "../auth/api";

export default function AddLocationModel({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [level, setLevel] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setName(""); setBuilding(""); setLevel(""); setRoom(""); setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr("Name is required"); return; }

    setLoading(true); setErr(null);
    try {
      const payload: CreateLocationInput = {
        name: name.trim(),
        building: building.trim() || undefined,
        level: level || undefined,
        room: room.trim() || undefined,
      };
      await createLocation(payload);
      onCreated();
      reset();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Failed to create location");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Location</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Name *</label>
            <input className="w-full border rounded-lg px-3 py-2" value={name}
              onChange={(e)=>setName(e.target.value)} placeholder="Lab A" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Building</label>
              <input className="w-full border rounded-lg px-3 py-2" value={building}
                onChange={(e)=>setBuilding(e.target.value)} placeholder="ICT" />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Level</label>
              <input className="w-full border rounded-lg px-3 py-2" value={level}
                onChange={(e)=>setLevel(e.target.value)} placeholder="1" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Room</label>
            <input className="w-full border rounded-lg px-3 py-2" value={room}
              onChange={(e)=>setRoom(e.target.value)} placeholder="A-104" />
          </div>

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border">Cancel</button>
            <button disabled={loading} className="px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60">
              {loading ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

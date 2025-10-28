import { useEffect, useMemo, useState } from "react";
import {
  createNode,
  fetchLocationsAll,
  type LocationDto,
  type CreateNodeInput,
} from "../auth/api";

const ipReg  = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const macReg = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export default function AddNodeModel({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [locs, setLocs] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // basic fields
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [mac, setMac] = useState("");
  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [locationId, setLocationId] = useState<string>("");

  // hardware fields
  const [poe, setPoe] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [ramSize, setRamSize] = useState<string>("512");
  const [ramUnit, setRamUnit] = useState<"MB" | "GB">("MB");
  const [storageSize, setStorageSize] = useState<string>("16");
  const [storageUnit, setStorageUnit] = useState<"GB" | "TB" | "MB">("GB");
  const [storageType, setStorageType] = useState("microSD");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try { setLocs(await fetchLocationsAll()); } catch {}
    })();
  }, [open]);

  const valid = useMemo(() => {
    const nodeOk = name.trim() && ipReg.test(ip) && macReg.test(mac);
    const r = Number(ramSize), s = Number(storageSize);
    const hwOk = Number.isFinite(r) && r >= 1 && Number.isFinite(s) && s >= 1;
    return !!(nodeOk && hwOk);
  }, [name, ip, mac, ramSize, storageSize]);

  function reset() {
    setName(""); setIp(""); setMac("");
    setModel(""); setBrand(""); setLocationId("");
    setPoe(false); setWifi(false);
    setRamSize("512"); setRamUnit("MB");
    setStorageSize("16"); setStorageUnit("GB");
    setStorageType("microSD");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    setLoading(true);
    setErr(null);

    try {
      const payload: CreateNodeInput = {
        name: name.trim(),
        ip_address: ip.trim(),
        mac_address: mac.trim().toUpperCase(),
        model: model.trim() || undefined,
        brand: brand.trim() || undefined,
        location_id: locationId || undefined,

        // hardware
        is_poe_compatible: poe,
        is_wireless_connectivity: wifi,
        ram_size: Number(ramSize),
        ram_unit: ramUnit,
        storage_size: Number(storageSize),
        storage_unit: storageUnit,
        storage_type: storageType.trim() || "microSD",
      };

      await createNode(payload);
      await onCreated();
      reset();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Failed to create node");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Node</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Name *</label>
            <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Node A-01" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">IP address *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={ip} onChange={e=>setIp(e.target.value)} placeholder="10.51.33.42" />
              {ip && !ipReg.test(ip) && <p className="text-xs text-rose-600 mt-1">Invalid IPv4</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">MAC address *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={mac} onChange={e=>setMac(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
              {mac && !macReg.test(mac) && <p className="text-xs text-rose-600 mt-1">Use AA:BB:CC:DD:EE:FF</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Model</label>
              <input className="w-full border rounded-lg px-3 py-2" value={model} onChange={e=>setModel(e.target.value)} placeholder="ESP32 v3" />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Brand</label>
              <input className="w-full border rounded-lg px-3 py-2" value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Murdoch IoT Lab" />
            </div>
          </div>

          {/* Location (existing only) */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Location</label>
            <select className="w-full border rounded-lg px-3 py-2 bg-white" value={locationId} onChange={(e)=>setLocationId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {locs.map(l => (
                <option key={String(l._id)} value={String(l._id)}>
                  {l.name || `Loc ${l._id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Hardware */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">PoE compatible</label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={poe} onChange={e=>setPoe(e.target.checked)} />
                Yes
              </label>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Wireless connectivity</label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={wifi} onChange={e=>setWifi(e.target.checked)} />
                Yes
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">RAM</label>
              <div className="flex gap-2">
                <input className="w-full border rounded-lg px-3 py-2" type="number" min={1} value={ramSize} onChange={e=>setRamSize(e.target.value)} />
                <select className="border rounded-lg px-2 py-2 bg-white" value={ramUnit} onChange={e=>setRamUnit(e.target.value as "MB"|"GB")}>
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                </select>
              </div>
              {ramSize && Number(ramSize) < 1 && <p className="text-xs text-rose-600 mt-1">Minimum is 1</p>}
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Storage</label>
              <div className="flex gap-2">
                <input className="w-full border rounded-lg px-3 py-2" type="number" min={1} value={storageSize} onChange={e=>setStorageSize(e.target.value)} />
                <select className="border rounded-lg px-2 py-2 bg-white" value={storageUnit} onChange={e=>setStorageUnit(e.target.value as "GB"|"TB"|"MB")}>
                  <option value="GB">GB</option>
                  <option value="TB">TB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
              {storageSize && Number(storageSize) < 1 && <p className="text-xs text-rose-600 mt-1">Minimum is 1</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1">Storage type</label>
            <input className="w-full border rounded-lg px-3 py-2" value={storageType} onChange={e=>setStorageType(e.target.value)} placeholder="microSD" />
          </div>

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border">Cancel</button>
            <button disabled={!valid || loading} className="px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-60">
              {loading ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

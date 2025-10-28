import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchNodeById } from "../auth/api";
import type { NodeDto } from "../auth/api";

export default function NodeDetailsPage() {
  const { id = "" } = useParams();
  const [node, setNode] = useState<NodeDto | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setNode(await fetchNodeById(id)); }
      catch (e: any) { setErr(e?.message ?? "Failed to load node"); }
    })();
  }, [id]);

  if (err) return <div className="text-red-600">{err}</div>;
  if (!node) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">{node.name}</div>
      <div className="grid grid-cols-2 gap-3">
        <Info label="IP" value={node.ip_address}/>
        <Info label="MAC" value={node.mac_address}/>
        <Info label="Model" value={node.model}/>
        <Info label="Brand" value={node.brand}/>
        <Info label="RAM" value={`${node.ram_size ?? "-"} ${node.ram_unit ?? ""}`}/>
        <Info label="Storage" value={`${node.storage_size ?? "-"} ${node.storage_unit ?? ""} (${node.storage_type ?? "-"})`}/>
        <Info label="PoE" value={String(node.is_poe_compatible)}/>
        <Info label="Wi-Fi" value={String(node.is_wireless_connectivity)}/>
        <Info label="Location Id" value={node.location_id ?? "-"}/>
        <Info label="Id" value={node._id}/>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm">{value || "-"}</div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";
import { api } from "../auth/api";

type Cfg = { embedUrl: string; reportId: string; token: string; expiresIn: number; tokenType?: string };

export default function TopLocations({
  pageName = "ReportSection1",
  visualName = "TopLocations",
}: { pageName?: string; visualName?: string }) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true, t: number | null = null;
    const load = async () => {
      try {
        const { data } = await api.get("/powerbi/embed-config");
        if (!alive) return;
        setCfg({ embedUrl: data.embedUrl, reportId: data.reportId, token: data.token, expiresIn: data.expiresIn });
        const ms = Math.max((data.expiresIn - 300) * 1000, 60_000);
        t && clearTimeout(t); t = window.setTimeout(load, ms);
      } catch (e: any) {
        if (!alive) return; setErr(e?.message ?? "Failed to load Top Locations");
      }
    };
    load();
    return () => { alive = false; if (t) clearTimeout(t); };
  }, []);

  if (err) return <div className="text-red-600 text-sm">{err}</div>;
  if (!cfg) return <div className="text-slate-500 text-sm">Loading top locations…</div>;

  return (
    <PowerBIEmbed
      embedConfig={{
        type: "visual",
        id: cfg.reportId,
        embedUrl: cfg.embedUrl,
        accessToken: cfg.token,
        tokenType: models.TokenType.Embed,
        pageName,
        visualName,
        settings: { visualSettings: { visualHeaders: [{ visible: false }] } },
      }}
      cssClassName="w-full h-[360px] rounded-lg"
    />
  );
}

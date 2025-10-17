import { useEffect, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";
import { api } from "../auth/api";

type EmbedConfig = {
  reportId: string;
  groupId: string;
  embedUrl: string;
  accessToken: string; // embed token mock for now
  tokenType: "Embed" | "Aad";
  expiresIn: number;
};

export default function PowerBIReport(){
  const [cfg, setCfg] = useState<EmbedConfig | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    setLoading(true);
    (async () => {
      try {
        const r = await api.get<EmbedConfig>("/powerbi/embed-config");
        setCfg(r.data);
        setErr(null);
      }catch (e:any){
        setErr(e?.response?.data?.error || e?.message || "failed to load power bi embed config");
      } finally{
        setLoading(false);
      }
    })();

  }, []);
if (loading) return <div className="h-96 rounded bg-slate-100 animated-pulse" />;
if (err) return <div className="text-rose-600 text-sm">{err}</div>;
if (!cfg) return <div className="text-slate-500 text-sm">No config.</div>;

return(
  <PowerBIEmbed
  embedConfig={{
    type: "report",
    id: cfg.reportId,
    embedUrl: cfg.embedUrl,
    accessToken: cfg.accessToken,
    tokenType: cfg.tokenType === "Aad" ? models.TokenType.Aad : models.TokenType.Embed,
    settings: {
      panes: { filters: {visible: false} },
      navContentPaneEnabled: true,
    },
  }}
  cssClassName="w=full h-[720px] rounded border"
  onError = {(event) =>{
    //with the moc token you will see "unauthorized " error
    console.warn("Power BI embed error:", event?.detail);
  }}
  />
);

}

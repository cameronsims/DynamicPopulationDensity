import { useEffect, useMemo, useRef, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models, Report, } from "powerbi-client";
import { fetchPbiEmbedConfig } from "../auth/api";

const PBI = {
  DATE: { table: "FactOccupancy", column: "EventTime" },
  LOC: { table: "DimLocation", column: "LocationName" },
};

export type PbiFilters = { location: string; range: "24h" | "7d" | "30d" };

type EmbedConfig = {
  reportId: string;
  groupId: string;
  embedUrl: string;
  accessToken: string;
  tokenType: "Embed" | "Aad";
  expiresIn: number; // seconds
};

type ExportSpec = {
  page: string;
  visualName: string;
  onRows: (rows: Record<string, any>[]) => void;
};

type Props = {
  pageName?: string;
  filters?: PbiFilters;
  height?: number;
  exportVisual?: ExportSpec;
};

const DEFAULT_FILTERS: PbiFilters = { location: "all", range: "24h" };

// brand theme inside the iframe
const THEME = {
  name: "HiveMetrics",
  dataColors: ["#e26128", "#9fe2d5", "#725c4e", "#000000", "#cccccc"],
  background: "#ffffff",
  foreground: "#000000",
  tableAccent: "#e26128",
} satisfies models.IReportTheme;

function debounce<T extends (...args: any[]) => any>(fn: T, ms = 250) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Small CSV parser for exportData
function csvToRows(csv: string): Record<string, any>[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = splitCsv(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsv(line);
    const row: Record<string, any> = {};
    headers.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export default function PowerBIReport({ pageName, filters, height = 560, exportVisual }: Props) {
  const effFilters = filters ?? DEFAULT_FILTERS;

  const [cfg, setCfg] = useState<EmbedConfig | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<Report | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build Power BI report-level filters from effFilters
  const reportFilters = useMemo(() => {
    try {
      const out: models.IFilter[] = [];

      // Location filter
      if (effFilters.location && effFilters.location !== "all") {
        const f = new models.BasicFilter(
          { table: PBI.LOC.table, column: PBI.LOC.column },
          "In",
          [effFilters.location]
        );
        out.push(f);
      }

      // Date range filter
      const days = effFilters.range === "24h" ? 1 : effFilters.range === "7d" ? 7 : 30;
      const end = new Date();
      const start = new Date(Date.now() - days * 24 * 3600 * 1000);

      const df = new models.AdvancedFilter(
        { table: PBI.DATE.table, column: PBI.DATE.column },
        "And",
        [
          { operator: "GreaterThanOrEqual", value: start.toISOString() },
          { operator: "LessThanOrEqual", value: end.toISOString() },
        ]
      );
      out.push(df);

      return out;
    } catch (e) {
      console.warn("[PBI] building filters failed:", e);
      return [];
    }
  }, [effFilters]);

  // Fetch embed config on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await fetchPbiEmbedConfig.getEmbedConfig();
        if (!mounted) return;
        setCfg(data);
        setErr(null);

        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        const ms = Math.max(30_000, Math.floor((data.expiresIn || 3600) * 1000 * 0.8));
        refreshTimer.current = setTimeout(async () => {
          try {
            const { data: fresh } = await fetchPbiEmbedConfig.getEmbedConfig();
            if (!reportRef.current) return;
            await reportRef.current.setAccessToken(fresh.accessToken);
            setCfg(fresh);
          } catch (e) {
            console.warn("[PBI] token refresh failed:", e);
          }
        }, ms);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.response?.data?.error || e?.message || "Failed to load Power BI embed config");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // Export helper
  const exportRows = async () => {
    if (!reportRef.current || !exportVisual) return;
    try {
      const pages = await reportRef.current.getPages();
      const page =
        pages.find((p) => p.displayName === exportVisual.page || p.name === exportVisual.page) ||
        pages[0];
      if (!page) return;
      if (pageName) await page.setActive();

      const visuals = await page.getVisuals();
      const visual: IVisual | undefined =
        visuals.find((v) => v.title === exportVisual.visualName || v.name === exportVisual.visualName);

      if (!visual || typeof (visual as any).exportData !== "function") return;

      const res = await (visual as any).exportData(models.ExportDataType.Summarized);
      const rows = csvToRows(res.data);
      exportVisual.onRows(rows);
    } catch (e) {
      console.warn("[PBI] exportRows failed:", e);
    }
  };

  const applyFilters = useMemo(
    () =>
      debounce(async () => {
        if (!reportRef.current) return;
        try {
          await reportRef.current.setFilters(reportFilters);
          if (exportVisual) await exportRows();
        } catch (e) {
          console.warn("[PBI] setFilters/export failed:", e);
        }
      }, 200),
    [reportFilters, exportVisual]
  );

  const onLoaded = async () => {
    if (!reportRef.current) return;
    try {
      // set page first, then filters, then export
      if (pageName) {
        const pages = await reportRef.current.getPages();
        const page = pages.find((p) => p.displayName === pageName || p.name === pageName);
        if (page) await page.setActive();
      }
      await reportRef.current.updateSettings({ theme: { themeJson: THEME } });
      await reportRef.current.setFilters(reportFilters);
      if (exportVisual) await exportRows();
    } catch (e) {
      console.warn("[PBI] onLoaded actions failed:", e);
    }
  };


  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (loading) return <div className="h-64 rounded bg-slate-100 animate-pulse" />;
  if (err) return <div className="text-rose-600 text-sm">{err}</div>;
  if (!cfg) return <div className="text-slate-500 text-sm">Power BI not configured.</div>;

  return (
    <PowerBIEmbed
      embedConfig={{
        type: "report",
        id: cfg.reportId,
        embedUrl: cfg.embedUrl,
        accessToken: cfg.accessToken,
        tokenType: cfg.tokenType === "Aad" ? models.TokenType.Aad : models.TokenType.Embed,
        settings: {
          panes: { filters: { visible: false } },
          navContentPaneEnabled: true,
          layoutType: models.LayoutType.Custom,
          customLayout: { displayOption: models.DisplayOption.FitToWidth },
          theme: { themeJson: THEME },
        },
      }}
      getEmbeddedComponent={(embed) => (reportRef.current = embed as Report)}
      eventHandlers={
        new Map([
          ["loaded", onLoaded],
          ["error", (e) => console.warn("Power BI error:", e?.detail)],
        ])
      }
      cssClassName="w-full rounded border"
      style={{ height }}
    />
  );
}

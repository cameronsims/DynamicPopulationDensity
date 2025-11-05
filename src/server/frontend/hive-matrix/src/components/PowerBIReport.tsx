
import { useEffect, useRef, useState } from "react";
import { PowerBIEmbed } from "powerbi-client-react";
import { models, Report, service } from "powerbi-client";
import { api } from "../auth/api";

type EmbedConfig = {
  reportId: string;
  groupId: string;
  embedUrl: string;
  accessToken: string;
  tokenType: "Embed" | "Aad";
  expiresIn: number;
};

type Props = {
  pageName: string;
  bookmarkName?: string;
  height?: number | string;
  className?: string;
};

export default function PowerBIReport({
  pageName,
  bookmarkName,
  height = 480,
  className = "",
}: Props) {
  const [cfg, setCfg] = useState<EmbedConfig | null>(null);
  const reportRef = useRef<Report | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get<EmbedConfig>("/v1/powerbi/embed-config");
        if (!cancelled) setCfg(r.data);
      } catch (e) {
        console.warn("Failed to load PBI embed config", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function switchToPage(rep: Report, displayOrTechName: string) {
    try {
      const pages = await rep.getPages();
      const target =
        pages.find((p) => p.displayName === displayOrTechName) ??
        pages.find((p) => p.name === displayOrTechName);
      if (!target) {
        console.warn("Page not found:", displayOrTechName, "Available:", pages.map(p => p.displayName));
        return;
      }
      await rep.setPage(target.name);

      if (bookmarkName) {
        try {
          const bmMgr = rep.bookmarksManager;
          const bms = await bmMgr.getBookmarks();
          const match = bms?.bookmarks?.find((b) => b.name === bookmarkName);
          if (match) await bmMgr.applyState({ state: match.state });
        } catch (err) {
          console.debug("Bookmark apply skipped:", err);
        }
      }
    } catch (err) {
      console.warn("switchToPage failed:", err);
    }
  }

  const handlers = new Map<service.EventName, (event?: any) => void>([
    [
      "loaded",
      async () => {
        if (reportRef.current) await switchToPage(reportRef.current, pageName);
      },
    ],
    [
      "rendered",

      async () => {
        if (!reportRef.current) return;
        try {
          const active = await reportRef.current.getActivePage();
          if (active.displayName !== pageName && active.name !== pageName) {
            await switchToPage(reportRef.current, pageName);
          }
        } catch {}
      },
    ],
    [
      "error",
      (e) => console.warn("PowerBI error:", e?.detail),
    ],
  ]);

  if (!cfg) return <div className="h-96 rounded bg-slate-100 animate-pulse" />;

  return (
    <div
      className={`w-full rounded border overflow-hidden ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <PowerBIEmbed
        embedConfig={{
          type: "report",
          id: cfg.reportId,
          embedUrl: cfg.embedUrl,
          accessToken: cfg.accessToken,
          tokenType: models.TokenType.Embed,
          settings: {
            panes: { filters: { visible: false } },
            navContentPaneEnabled: false,
            pageNavigationButtons: false,
            layoutType: models.LayoutType.Custom,
            customLayout: { displayOption: models.DisplayOption.FitToPage },
            background: models.BackgroundType.Transparent,
          },
        }}
        getEmbeddedComponent={(embed) => (reportRef.current = embed as Report)}
        eventHandlers={handlers}
        cssClassName="w-full h-full"
      />
    </div>
  );
}

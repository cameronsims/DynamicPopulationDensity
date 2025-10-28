
import { api } from "../auth/api";

export type Metrics = {
  kpis: {
    currentCount: number;
    changePct: number;
    activeLocations: number;
    onlineNodes: number;
  };
  series?: {ts: number; count: number}[];
  heatmap?: {rows: number; cols: number; grid: number[] };
};

export async function getMetrics(filters?: { location?: string; range?: string }): Promise<Metrics> {
  const params = new URLSearchParams();
  if (filters?.location) params.set("location", filters.location);
  if (filters?.range) params.set("range", filters.range);
  const q = params.toString();
  const r = await api.get<Metrics>("/api/metrics" + (q ? `?${q}` : ""));
  return r.data;
}


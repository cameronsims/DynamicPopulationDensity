import axios from "axios";
import { CONFIG } from "../config";
import { getAuthCtx } from "./ctxSingle";

export const api = axios.create({
  baseURL: CONFIG.API_BASE || 'http://localhost:8080',
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  let token: string | null = null;
  try {
    token = getAuthCtx().accessToken;
  } catch {
//
  }
  if (!token) token = sessionStorage.getItem("accessToken");

  if (token) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

/*  Types  */

export type NodeDto = {
  _id: string;
  name: string;
  ip_address: string;
  mac_address: string;
  model: string | null | undefined;
  brand: string | null | undefined;

  ram_size?: number | null;
  ram_unit?: string | null;
  storage_size?: number | null;
  storage_unit?: string | null;
  storage_type?: string | null;
  is_poe_compatible?: boolean | null;
  is_wireless_connectivity?: boolean | null;

  location_id?: string | null;
  status?: "online" | "offline";
};

export type LocationDto = {
  _id: string;
  name?: string;
  building?: string;
  level?: string | number;
  room?: string;
};


//create location

export type CreateLocationInput = {
  name: string;
  building?: string;
  level?: string | number;
  room?: string;
};

export async function createLocation(input: CreateLocationInput): Promise<LocationDto> {
  const { data } = await api.post<LocationDto>("/v1/locations", input);
  return data;
}

export type NodesSummary = {
  total: number;
  online: number;
  offline: number;
  windowMin: number;
};

export type CreateNodeInput = {
  name: string;
  ip_address: string;
  mac_address: string;
  model?: string;
  brand?: string;
  location_id?: string;
  location?: {
    name: string;
    building?: string;
    level?: string | number;
    room?: string;
  };


  is_poe_compatible?: boolean;
  is_wireless_connectivity?: boolean;
  ram_size?: number;
  ram_unit?: "MB" | "GB";
  storage_size?: number;
  storage_unit?: "GB" | "TB" | "MB";
  storage_type?: string;
};

/* Node/Location API */

export async function fetchNodesAll(): Promise<NodeDto[]> {
  const { data } = await api.get<NodeDto[]>("/v1/nodes/all");
  return data;
}

export async function fetchNodeById(id: string): Promise<NodeDto> {
  const { data } = await api.get<NodeDto>(`/v1/nodes/${id}`);
  return data;
}

export async function fetchNodeCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/v1/nodes/count");
  return data.count;
}

export async function fetchLocationsAll(): Promise<LocationDto[]> {
  const { data } = await api.get<LocationDto[]>("/v1/locations/all");
  return data;
}



export async function deleteLocation(id: string): Promise<void> {
  if (!id) throw new Error("Location ID is required");
  await api.delete(`/v1/locations/${encodeURIComponent(id)}`);

}

export async function fetchNodesSummary(): Promise<NodesSummary> {
  const { data } = await api.get<NodesSummary>("/v1/nodes/summary");
  return data;
}

export async function createNode(input: CreateNodeInput): Promise<NodeDto> {
  const { data } = await api.post<NodeDto>("/v1/nodes", input);
  return data;
}

export async function deleteNode(id: string): Promise<void> {
  await api.delete(`/v1/nodes/${id}`);
}

/* Power BI embed config */

const PBI_BASE =
  (CONFIG as any).PBI_API_BASE ||
  (import.meta as any).env?.VITE_PBI_API_BASE ||
  "";

export type PbiEmbedConfig = {
  reportId: string;
  groupId: string;
  embedUrl: string;
  accessToken: string;
  tokenType: "Embed" | "Aad";
  expiresIn: number;
};

export const fetchPbiEmbedConfig = {
  async getEmbedConfig(): Promise<{ data: PbiEmbedConfig }> {
    if (!PBI_BASE) {
      throw new Error("PBI_API_BASE not set (check VITE_PBI_API_BASE / CONFIG.PBI_API_BASE)");
    }
    const { data } = await axios.get<PbiEmbedConfig>(`${PBI_BASE}/pbi/embed-config`, {
      withCredentials: true,
    });
    return { data };
  },
};



import axios from "axios";
import { getAuthCtx } from "./ctxSingle";
import { CONFIG } from "../config";

export const api = axios.create({
  baseURL: CONFIG.API_BASE,
  withCredentials: true,
});


api.interceptors.request.use((cfg) => {
  const ctx = getAuthCtx?.();
  const t = ctx?.accessToken || sessionStorage.getItem("accessToken");
  if (t) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any).Authorization = `Bearer ${t}`;
  }
  return cfg;
});

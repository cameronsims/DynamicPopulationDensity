export const CONFIG = {
  API_BASE: import.meta.env.VITE_API_BASE || "/api",
  USE_MOCK: String(import.meta.env.VITE_USE_MOCK || "true")=== "true",
};

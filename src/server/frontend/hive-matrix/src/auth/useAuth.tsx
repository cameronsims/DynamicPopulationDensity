
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { AccountInfo } from "@azure/msal-browser";
import { jwtDecode } from "jwt-decode";

import { api } from "./api";
import { setAuthCtx } from "./ctxSingle";
import { msal, signinScopes, ensureMsal, appRedirectUri } from "./msal";

// types
type JWTPayload = {
  exp?: number;
  iat?: number;
  sub?: string;
}

type ActivityRef = {
  current: number;
  timeout: NodeJS.Timeout | null;
  interval: NodeJS.Timeout | null;
};

type LastActivity = {
  timestamp: number;
  hasChecked: boolean;
};

type User = { id: string; name: string };

type Ctx = {
  user: User | null;
  accessToken: string | null;
  isAuthed: boolean;
  booting: boolean;
  msalReady: boolean;
  setAccessToken: (t: string | null) => void;
  loginWithDemo: (email: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  handleMicrosoftCallback: (code?: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

type AuthMethod = "msal" | "demo" | null;

// context + hook
const CtxObj = createContext<Ctx | null>(null);

export function useAuth(): Ctx {
  const ctx = useContext(CtxObj);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// helpers
function accountToUser(acc: AccountInfo | null): User | null {
  if (!acc) return null;
  return { id: acc.localAccountId, name: acc.name || acc.username || "User" };
}

function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    if (!decoded?.exp) return false;
    return decoded.exp * 1000 > Date.now() + 30000;
  } catch {
    return false;
  }
}

// component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, _setToken] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [msalReady, setMsalReady] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const activityRef = useRef<ActivityRef>({
    current: Date.now(),
    timeout: null,
    interval: null,
  });

const MSAL_OFF = import.meta.env.VITE_DISABLE_MSAL ==="1"; // remove this line when you need microsoft login


  const setAccessToken = useCallback((t: string | null) => {
    if (t && !isTokenValid(t)) {
      console.warn("[auth] attempted to set invalid/expired token");
      t = null;
    }
    _setToken(t);
    if (t) {
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
      sessionStorage.setItem("accessToken", t);
    } else {
      delete api.defaults.headers.common.Authorization;
      sessionStorage.removeItem("accessToken");
    }
  }, []);

  async function mintDevTokenForMsal(account: AccountInfo) {
    try {
      const r = await api.post("/v1/auth/msal-bridge", {
        sub: account.localAccountId,
        name: account.name || account.username,
      });
      if (r?.data?.accessToken) setAccessToken(r.data.accessToken);
      if (r?.data?.user) setUser(r.data.user);
    } catch (e) {
      console.warn("[auth] msal-bridge failed (dev only):", e);
    }
  }


  async function applyMsalAccount(acc: AccountInfo) {
    msal.setActiveAccount(acc);
    setUser(accountToUser(acc));
    setAuthMethod("msal");
    await mintDevTokenForMsal(acc);
  }

  // 1) MSAL init + handle redirect on app start
  useEffect(() => {
    if (MSAL_OFF) { setMsalReady(true); return; } // remove this line when you need microsoft login
    (async () => {
      await ensureMsal();
      try {
        const result = await msal.handleRedirectPromise().catch((e) => {
          console.error("[MSAL] handleRedirectPromise error:", e);
          return null;
        });
        if (result?.account) {
          await applyMsalAccount(result.account);
          console.log("[MSAL] redirect OK:", result.account.username);
        } else {
          const acct = msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
          if (acct) {
            await applyMsalAccount(acct);
            console.log("[MSAL] using cached account:", acct.username);
          }
        }
      } finally {
        setMsalReady(true);
      }
    })();
  }, []);

  //2) Demo refresh bootstrap (restore saved token if valid, then try refresh)
  useEffect(() => {
  (async () => {
    try {
      const saved = sessionStorage.getItem("accessToken");
      if (saved && isTokenValid(saved)) {
        console.log("[auth] restoring saved token");
        setAccessToken(saved);
      }

      console.log("[auth] attempting refresh");
      const r = await api.post("/v1/auth/refresh");
      if (r?.data?.accessToken) {
        console.log("[auth] refresh successful");
        setAccessToken(r.data.accessToken);
        if (r?.data?.user) {
          setUser(r.data.user);
          setAuthMethod("demo");
        }

        activityRef.current.current = Date.now();
        sessionStorage.setItem('lastActivity', Date.now().toString());
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("[auth] refresh failed: no valid refresh token");
      } else {
        console.error("[auth] refresh failed:", err);
      }

      if (!booting) {
        setAccessToken(null);
        setUser(null);
        setAuthMethod(null);
      }
    } finally {
      setBooting(false);
    }
  })();
}, [setAccessToken, booting]);

  // 3) Expose a tiny API to singletons
  useEffect(() => {
    setAuthCtx({
      accessToken,
      setAccessToken,
      logout: () => {
        setUser(null);
        setAccessToken(null);
      },
    });
  }, [accessToken, setAccessToken]);

  // actions
  async function loginWithDemo(email: string, password: string) {
    const r = await api.post("/v1/auth/login", { email, password, mode: "demo" });
    if (!r.data?.accessToken) throw new Error("No access token received");
    setUser(r.data.user);
    setAccessToken(r.data.accessToken);
    setAuthMethod("demo");
  }

  async function loginWithMicrosoft() {
    if (MSAL_OFF) { alert( "Microsoft login is disabled for this environment."); return; } // remove this line when you need microsoft login
    try {
      await ensureMsal();
      await msal.loginRedirect({
        scopes: signinScopes,
        redirectUri: appRedirectUri,
        prompt: "select_account",
      });
    } catch (e: any) {
      console.error("[auth] MSAL redirect error:", e);
      alert("MSAL redirect error: " + (e?.message || String(e)));
    }
  }

  async function handleMicrosoftCallback(_code?: string | null) {
    if (MSAL_OFF) throw new Error("MSAL disabled"); // remove this line when you need microsoft login
    await ensureMsal();
    const result = await msal.handleRedirectPromise();
    if (result?.account) {
      await applyMsalAccount(result.account);
      return;
    }
    const acct = msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
    if (acct) {
      await applyMsalAccount(acct);
      return;
    }
    throw new Error("No Microsoft account found in callback");
  }



  // logout function
const logout = useCallback(async () => {
    try {
      console.log("[auth] logging out…");
      await api.post("/v1/auth/logout");
    } catch (err) {
      console.warn("[auth] logout API failed (continuing):", err);
    } finally {
      const wasMsal = authMethod === "msal";
      setUser(null);
      setAccessToken(null);
      setAuthMethod(null);
      sessionStorage.removeItem("accessToken");

      if (wasMsal) {
        try {
          await ensureMsal();
          const acct = msal.getActiveAccount() ?? undefined;
          await msal.logoutRedirect({ account: acct });
        } catch (err) {
          console.error("[MSAL] logout error:", err);
        }
      }
    }
  }, [authMethod, setAccessToken]);



  // Auto-refresh 1 minute before token expiry
  useEffect(() => {
  if (!accessToken || authMethod === 'msal') return;

  try {
    const decoded = jwtDecode<JWTPayload>(accessToken);
    if (!decoded.exp) return;

    const expiresIn = decoded.exp * 1000 - Date.now();
    const refreshDelay = Math.max(0, expiresIn - 60000); // 1 minute before expiry

    const refreshTimer = setTimeout(async () => {
      try {
        console.log("[auth] Token expiring soon, attempting refresh");
        const r = await api.post("/v1/auth/refresh");
        if (r?.data?.accessToken) {
          console.log("[auth] Token refreshed successfully");
          setAccessToken(r.data.accessToken);
          if (r?.data?.user) {
            setUser(r.data.user);
          }
        }
      } catch (err) {
        console.error("[auth] Token refresh failed:", err);
        logout();
      }
    }, refreshDelay);

    return () => clearTimeout(refreshTimer);
  } catch (err) {
    console.error("[auth] Token decode failed:", err);
    logout();
  }
}, [accessToken, authMethod, logout, setAccessToken]);

  // debug ( remove if want to )
  useEffect(() => {
    console.log("[auth] state:", {
      hasUser: !!user,
      hasToken: !!accessToken,
      authMethod,
      booting,
      msalReady,
    });
  }, [user, accessToken, authMethod, booting, msalReady]);

  return (
    <CtxObj.Provider
      value={{
        user,
        accessToken,
        isAuthed: !!(user || accessToken),
        booting,
        msalReady,
        setAccessToken,
        loginWithDemo,
        loginWithMicrosoft,
        handleMicrosoftCallback,
        logout,
      }}
    >
      {children}
    </CtxObj.Provider>
  );
}

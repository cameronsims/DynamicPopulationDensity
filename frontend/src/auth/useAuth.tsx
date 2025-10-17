
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { setAuthCtx } from "./ctxSingle";
import { msal, signinScopes, ensureMsal, appRedirectUri } from "./msal";
import type { AccountInfo } from "@azure/msal-browser";

// -------------------- types --------------------
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
  logout: () => Promise<void>;
};

// -------------------- context + hook --------------------
const CtxObj = createContext<Ctx | null>(null);
type AuthMethod = "msal" | "demo" | null;

export function useAuth(): Ctx {
  const ctx = useContext(CtxObj);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// -------------------- component --------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, _setToken] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [msalReady, setMsalReady] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);

  // keep axios header + sessionStorage in sync
  const setAccessToken = (t: string | null) => {
    _setToken(t);
    if (t) {
      (api.defaults.headers.common as any).Authorization = `Bearer ${t}`;
      sessionStorage.setItem("accessToken", t);
    } else {
      delete (api.defaults.headers.common as any).Authorization;
      sessionStorage.removeItem("accessToken");
    }
  };

  // ---- helpers ----
  function accountToUser(acc: AccountInfo | null): User | null {
    if (!acc) return null;
    return { id: acc.localAccountId, name: acc.name || acc.username || "User" };
  }

  // DEV-ONLY: after MSAL completes, mint a local JWT so mock APIs work
  async function mintDevTokenForMsal(account: AccountInfo) {
    try {
      const r = await api.post("/auth/msal-bridge", {
        sub: account.localAccountId,
        name: account.name || account.username,
      });
      if (r?.data?.accessToken) setAccessToken(r.data.accessToken);
      if (r?.data?.user) setUser(r.data.user);
    } catch (e) {
      console.warn("[auth] msal-bridge failed (dev only):", e);
    }
  }

  // 1) MSAL init + handle redirect on app start
  useEffect(() => {
    (async () => {
      await ensureMsal();

      try {
        const result = await msal.handleRedirectPromise().catch((e) => {
          console.error("[MSAL] handleRedirectPromise error:", e);
          return null;
        });

        if (result?.account) {
          msal.setActiveAccount(result.account);
          setUser(accountToUser(result.account));
          setAuthMethod("msal");
          await mintDevTokenForMsal(result.account);
          console.log("[MSAL] redirect OK:", result.account.username);
        } else {
          const acct = msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
          if (acct) {
            msal.setActiveAccount(acct);
            setUser(accountToUser(acct));
            setAuthMethod("msal");
            await mintDevTokenForMsal(acct);
            console.log("[MSAL] using cached account:", acct.username);
          }
        }
      } finally {
        setMsalReady(true);
      }
    })();
  }, []);

  // 2) Demo refresh bootstrap
  useEffect(() => {
    (async () => {
      try {
        const saved = sessionStorage.getItem("accessToken");
        if (saved) setAccessToken(saved);

        const r = await api.post("/auth/refresh", {});
        if (r?.data?.accessToken) setAccessToken(r.data.accessToken);
        if (r?.data?.user) setUser(r.data.user);
      } catch {
        // ignore in mock
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // 3) Expose a tiny API to singletons (used by components/utilities)
  useEffect(() => {
    setAuthCtx({
      accessToken,
      setAccessToken,
      logout: () => {
        setUser(null);
        setAccessToken(null);
      },
    });
  }, [accessToken]);

  // ---- actions ----
  async function loginWithDemo(email: string, password: string) {
    const r = await api.post("/auth/login", { email, password, mode: "demo" });
    setUser(r.data.user);
    setAccessToken(r.data.accessToken);
    setAuthMethod("demo");
  }

  async function loginWithMicrosoft() {
    try {
      await ensureMsal();
      await msal.loginRedirect({
        scopes: signinScopes,
        redirectUri: appRedirectUri, // "/" per msal.ts
        prompt: "select_account",
      });
    } catch (e: any) {
      console.error("[auth] MSAL redirect error:", e);
      alert("MSAL redirect error: " + (e?.message || String(e)));
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    const isMsal = authMethod === "msal";

    // clear local session
    setUser(null);
    setAccessToken(null);
    setAuthMethod(null);

    if (isMsal) {
      try {
        await ensureMsal();
        const acct = msal.getActiveAccount() ?? undefined;
        await msal.logoutRedirect({ account: acct }); // postLogoutRedirectUri -> /login
        return;
      } catch (e) {
        console.error("[MSAL] logout error:", e);
      }
    }
    // For demo logout, ProtectedRoute will send to /login automatically.
  }

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
        logout,
      }}
    >
      {children}
    </CtxObj.Provider>
  );
}

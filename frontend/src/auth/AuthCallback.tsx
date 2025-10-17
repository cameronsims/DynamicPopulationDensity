import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ensureMsal, msal } from "../auth/msal";

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {


    (async () => {
      try {
        await ensureMsal();

        const res = await msal.handleRedirectPromise();

        if (res?.account) {
          msal.setActiveAccount(res.account);
          console.log("[MSAL] /auth/callback OK:", res.account.username);
          nav("/dashboard", { replace: true });
          return;
        }

        if (location.hash) {
          const params = new URLSearchParams(location.hash.slice(1));
          const err = params.get("error") || "unknown_error";
          const desc = params.get("error_description") || "No description";
          console.error("[MSAL] callback hash:", Object.fromEntries(params));
          alert(`Microsoft sign-in failed: ${err}\n\n${desc}`);
        }
        nav("/login", { replace: true });
      } catch (e: any) {
        console.error("[MSAL] /auth/callback error:", e);
        alert("Microsoft sign-in error: " + (e?.errorMessage || e?.message || String(e)));
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  return <div style={{ padding: 24 }}>Signing you in…</div>;
}

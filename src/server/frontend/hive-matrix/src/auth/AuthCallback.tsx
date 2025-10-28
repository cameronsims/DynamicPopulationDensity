import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function AuthCallback() {
  const { handleMicrosoftCallback } = useAuth();
  const nav = useNavigate();
  const code = new URLSearchParams(useLocation().search).get("code");

  useEffect(() => {
    (async () => {
      try {
        await handleMicrosoftCallback(code);
        nav("/dashboard", { replace: true });
      } catch (e) {
        console.error("[MSAL] /auth/callback error:", e);
        nav("/login?error=sso", { replace: true });
      }
    })();
  }, [code, nav, handleMicrosoftCallback]);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">Signing you in…</div>
    </div>
  );
}




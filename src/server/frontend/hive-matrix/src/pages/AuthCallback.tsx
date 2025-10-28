import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function AuthCallback() {
  const { handleMicrosoftCallback } = useAuth();
  const nav = useNavigate();
  const code = new URLSearchParams(useLocation().search).get("code");

  useEffect(() => {
    (async () => {
      if (!code) return nav("/login", { replace: true});
      try {
        await handleMicrosoftCallback(code);
        nav("/dashboard", { replace: true});
      } catch {
        nav("/login?error=sso",{ replace: true});
      }
    }) ();
  }, [code]);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">Signing you in…</div>
    </div>
  );
}

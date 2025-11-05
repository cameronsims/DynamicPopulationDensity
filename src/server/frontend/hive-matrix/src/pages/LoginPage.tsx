
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { loginWithDemo, loginWithMicrosoft, isAuthed } = useAuth();
  const [email, setEmail] = useState(import.meta.env.VITE_DEMO_EMAIL ?? "");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  const MSAL_OFF = import.meta.env.VITE_DISABLE_MSAL ==="1"; // remove this line when you need microsoft login

  useEffect(() => {
    if (isAuthed) nav(loc.state?.from?.pathname ?? "/dashboard", { replace: true });
  }, [isAuthed, nav, loc.state?.from?.pathname]);

  async function onDemo(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await loginWithDemo(email, pw);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100">
      <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold">Sign in</h1>

        <form onSubmit={onDemo} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full border rounded px-3 py-2" />
          <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2" />
          <button type="submit" disabled={loading} className="w-full rounded bg-slate-900 text-white py-2 hover:bg-slate-800 disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in (Demo)"}
          </button>
        </form>


        {!MSAL_OFF && ( // remove this line when you need microsoft login
          <>

        <div className="text-sm text-center">— or —</div>

        <button onClick={loginWithMicrosoft} className="w-full border rounded py-2 hover:bg-slate-50">
          Sign in with Microsoft
        </button>
        </>

        )}

        {err && <p className="text-red-600 text-sm">{err}</p>}
      </div>
    </div>
  );
}


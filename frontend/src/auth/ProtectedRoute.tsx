import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute() {
  const { isAuthed, booting } = useAuth();

  const loc = useLocation();
  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100">
        <div className="rounded-xl bg-white shadow px-4 py-3 text-slate-700">Loading…</div>
      </div>
    );
  }

  return isAuthed ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />;
}

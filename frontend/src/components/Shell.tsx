import { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";

export default function Shell ({ title, children }: {title: string; children: ReactNode}){
  const { logout } = useAuth();
 return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

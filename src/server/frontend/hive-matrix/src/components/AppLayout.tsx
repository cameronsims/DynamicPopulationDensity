
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const SECTIONS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/location", label: "Location" },
  { to: "/nodes", label: "Nodes" },
  { to: "/data-visuals", label: "Data Visuals" },
];

export default function AppLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-white">
        <div className="h-16 flex items-center px-4 font-bold">
          <span className="font-heading text-brick text-2xl md:text-3xl leading-none">
            Hive Metrix
          </span>
        </div>
        <nav className="px-2 py-2 space-y-1">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                [
                  "block rounded-lg px-3 py-2 text-sm",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")
              }
            >
              {s.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Header (taller, bigger logo) */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="mx-auto max-w-7xl px-4 md:px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo-hivemetrix.png"
                alt="Hive Metrix"
                className="h-12 md:h-20 w-22"
              />
            </div>

            <button
              onClick={logout}
              className="rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-7xl px-4 md:px-6 py-3 md:py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

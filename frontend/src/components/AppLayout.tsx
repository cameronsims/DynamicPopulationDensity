import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const SECTIONS = [
  {to: "/dashboard", label: "Dashboard"},
  {to: "/data", label: "Data"},
  {to: "/project-details", label: "Project Details"},
  {to: "/data-visuals", label: "Data Visuals" },
  { to: "/team", label: "Team" },
  { to: "/saved", label: "Saved" },
  { to: "/draft", label: "Draft" },
  { to: "/trash", label: "Trash" },
];

export default function AppLayout(){
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* sidebar */}
      <aside className="hidden md:block w-64 border-r bg-white">
        <div className="h-14 flex items-center px-4 font-bold"> Hive Metrix</div>
        <nav className="px-2 py-2 space-y-1">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {s.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* main column */}
      <div className="flex-1 flex flex-col">
        {/* top bar */}
        <header className="h-14 border-b bg-white flex items-center justify-between px-4 gap-3">
          <div className="md:hidden font-semibold">DPD Console</div>
          <div className="flex-1 max-w-xl">
            <input
              type="search"
              placeholder="Search"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-800"
          >
            Log out
          </button>
        </header>

        {/* page content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

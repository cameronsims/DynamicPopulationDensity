type Props = {
  label: string;
  value: string | number;
  delta?: number;
  hint?: string;
};

export default function StatCard({ label, value, delta, hint }: Props){
  const isUp = typeof delta === "number" && delta >= 0;
 return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-slate-500 flex items-center gap-2">
        {typeof delta === "number" && (
          <span className={`text-xs rounded px-1.5 py-0.5 ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint}
      </div>
    </div>
  );
}

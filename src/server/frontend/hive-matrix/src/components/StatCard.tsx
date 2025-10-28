
type Props = {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
};

export default function StatCard({ label, value, sub, className }: Props) {
  const base =
    "rounded-2xl bg-white p-4 border shadow-sm";

  return (
    <div className={[base, className].filter(Boolean).join(" ")}>
      <div className="text-[11px] tracking-wide text-slate-500 uppercase">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1 text-slate-900">{value}</div>
      {sub ? <div className="text-xs text-slate-400 mt-1">{sub}</div> : null}
    </div>
  );
}

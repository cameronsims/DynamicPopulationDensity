function bandClass(v: number){
  const i = Math.min(4, Math.max(0, Math.floor(v / 25)));
  return ["bg-slate-200", "bg-emerald-200", "bg-emerald-300", "bg-amber-300", "bg-rose-300"][i];

}

export default function HeatmapPlaceholder({
  rows,
  cols,
  values,
}: {
  rows: number;
  cols: number;
  values: number[]

}){
  const n = Math.min(values.length, rows * cols);
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          title={`${values[i]}%`}
          className={`aspect-[4/3] rounded border border-white/40 ${bandClass(values[i])}`}
        />
      ))}
    </div>
  );
}

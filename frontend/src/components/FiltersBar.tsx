import { useState, useEffect } from "react";

export type Filters = { location: string; range: "24h" | "7d" | "30d" };

export default function FiltersBar({
  value,
  onChange,
  resetTo,
}:{
  value: Filters;
  onChange: (v: Filters) => void;
  resetTo?: Filters;
}){
  const [loc, setLoc] = useState(value.location);
  const [range, setRange] = useState<Filters["range"]>(value.range);

  useEffect(() => {
    setLoc(value.location);
    setRange(value.range);
  },[value.location, value.range]);

  function apply(){
    onChange({ location: loc, range});
  }

  function reset(){
    const d = resetTo ?? {location: "all", range: "24h" as const};
    setLoc(d.location);
    setRange(d.range);
    onChange(d);
  }

  return(
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div>
        <div className="text-xs text-slate-500 mb-1"> Location </div>
        <select
        value = {loc}
        onChange={(e) => setLoc(e.target.value)}
        className="border rounded-lg px-3 py-2 bg-white"
        >
          <option value="all"> All </option>
          <option value="campus-a">Campus A</option>
          <option value="campus-b">Campus B</option>
          <option value="library">Library</option>
        </select>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1"> Date range</div>
        <select
        value={range}
        onChange={(e) => setRange(e.target.value as Filters["range"])}
        className="border rounded-lg px-3 py-2 bg-white"
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <button
      onClick={apply}
      className="h-10 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
      >
        Apply
      </button>

      <button
      onClick={reset}
      className="h-10 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        Reset
      </button>
    </div>
  );
}

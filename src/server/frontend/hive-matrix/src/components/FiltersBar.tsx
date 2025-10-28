import { useEffect, useMemo, useState } from "react";

export type Filters = { location: string; range: "24h" | "7d" | "30d" };
export type LocationOption = { id: string; label: string };

export default function FiltersBar({
  value,
  onChange,
  resetTo,
  locations,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
  resetTo?: Filters;
  locations?: LocationOption[];
}) {
  const [loc, setLoc] = useState(value.location);
  const [range, setRange] = useState<Filters["range"]>(value.range);

  const opts = useMemo<LocationOption[]>(
    () => [{ id: "all", label: "All" }, ...(locations ?? [])],
    [locations]
  );


  useEffect(() => {
    const exists = opts.some((o) => o.id === value.location);
    setLoc(exists ? value.location : "all");
    setRange(value.range);
  }, [value.location, value.range, opts]);

  function apply() {
    const exists = opts.some((o) => o.id === loc);
    onChange({ location: exists ? loc : "all", range });
  }

  function reset() {
    const d = resetTo ?? ({ location: "all", range: "24h" } as const);
    setLoc(d.location);
    setRange(d.range);
    onChange(d);
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div>
        <div className="text-xs text-slate-500 mb-1">Location</div>
        <select
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white"
        >
          {opts.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-xs text-slate-500 mb-1">Date range</div>
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
        className="h-10 px-4 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
      >
        Reset
      </button>
    </div>
  );
}

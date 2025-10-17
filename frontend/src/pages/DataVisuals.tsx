import PowerBIReport from "../components/PowerBIReport";

export default function DataVisualsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Data Visuals</h1>
      <PowerBIReport />
      <p className="text-xs text-slate-500">
        (Using mock embed config for wiring; will render your real report once we switch to a real embed token.)
      </p>
    </div>
  );
}

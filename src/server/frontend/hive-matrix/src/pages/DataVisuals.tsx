import PowerBIReport from "../components/PowerBIReport";

export default function DataVisualsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Data Visuals</h1>
      <h2 className="text-lg font-medium">Total Number of devices by Day and Location</h2>
      <PowerBIReport pageName="Columnchart" height={560} />
      <p className="text-xs text-slate-500">

      </p>
    </div>
  );
}

export default function Sparkline({ points }: { points: number[] }) {
  if (!points || points.length === 0) {

    return (
      <svg width="100%" height="80" viewBox="0 0 480 80" className="block">
        <line x1="6" y1="40" x2="474" y2="40" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      </svg>
    );
  }

  const w = 480, h = 80, pad = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (points.length - 1);

  const d = points
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="100%" height="80" viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-900" />
    </svg>
  );
}

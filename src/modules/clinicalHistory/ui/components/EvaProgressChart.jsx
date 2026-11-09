function evaluationPoints(evaluations) {
  return evaluations
    .filter((evaluation) => evaluation.evaScore != null && evaluation.createdAt)
    .map((evaluation) => ({
      id: evaluation.id,
      date: evaluation.createdAt,
      score: evaluation.evaScore,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export function EvaProgressChart({ evaluations }) {
  const points = evaluationPoints(evaluations);
  if (points.length < 2) return null;

  const width = Math.max(480, points.length * 88);
  const height = 220;
  const left = 38;
  const right = width - 18;
  const top = 24;
  const bottom = 164;
  const xStep = (right - left) / (points.length - 1);
  const plotted = points.map((point, index) => ({
    ...point,
    x: left + xStep * index,
    y: bottom - (point.score / 10) * (bottom - top),
  }));
  const line = plotted.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold text-slate-800">Registro de dolor (EVA)</h2>
        <p className="text-xs text-slate-500">
          Mediciones registradas de 0 a 10, en orden cronológico. La gráfica presenta los datos y
          no genera una interpretación clínica.
        </p>
      </div>
      <div className="overflow-x-auto" aria-label="Gráfica cronológica de mediciones EVA">
        <svg
          className="h-56 max-w-none"
          style={{ width }}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Gráfica de ${points.length} mediciones de dolor EVA`}
        >
          {[0, 5, 10].map((score) => {
            const y = bottom - (score / 10) * (bottom - top);
            return (
              <g key={score}>
                <line x1={left} x2={right} y1={y} y2={y} stroke="#e2e8f0" />
                <text x={left - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-xs">
                  {score}
                </text>
              </g>
            );
          })}
          <polyline
            points={line}
            fill="none"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {plotted.map((point) => (
            <g key={point.id}>
              <circle cx={point.x} cy={point.y} r="5" fill="#0f766e" />
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                className="fill-slate-800 text-xs font-semibold"
              >
                {point.score}
              </text>
              <text
                x={point.x}
                y={bottom + 24}
                textAnchor="middle"
                className="fill-slate-500 text-xs"
              >
                {formatDate(point.date)}
              </text>
            </g>
          ))}
          <text x={left} y={height - 8} className="fill-slate-500 text-xs">EVA /10</text>
        </svg>
      </div>
      <ul className="sr-only">
        {plotted.map((point) => (
          <li key={point.id}>{formatDate(point.date)}: EVA {point.score} de 10</li>
        ))}
      </ul>
    </section>
  );
}

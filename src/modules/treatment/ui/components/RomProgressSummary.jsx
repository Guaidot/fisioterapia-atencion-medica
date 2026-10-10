import { usePatientRomProgress } from '../hooks/useTreatment.js';

function comparisonRows(measurements) {
  const grouped = new Map();
  for (const measurement of measurements) {
    const key = [
      measurement.joint.toLowerCase(),
      measurement.movement.toLowerCase(),
      measurement.side ?? '',
    ].join('|');
    const previous = grouped.get(key) ?? [];
    previous.push(measurement);
    grouped.set(key, previous);
  }

  return [...grouped.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const sorted = group.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const prior = sorted.at(-2);
      const latest = sorted.at(-1);
      return { prior, latest, difference: latest.degrees - prior.degrees };
    })
    .sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
}

export function RomProgressSummary({ clinicalEvaluations }) {
  const measurementsQuery = usePatientRomProgress(
    clinicalEvaluations.map((evaluation) => evaluation.id),
  );
  if (clinicalEvaluations.length < 2) return null;
  if (measurementsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Cargando comparación de goniometría…</p>;
  }
  if (measurementsQuery.isError) {
    return (
      <p role="alert" className="text-sm text-red-700">
        No se pudo cargar la comparación de goniometría: {measurementsQuery.error.message}
      </p>
    );
  }

  const comparisons = comparisonRows(measurementsQuery.data);
  if (comparisons.length === 0) return null;

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold text-slate-800">Comparación de goniometría</h2>
        <p className="text-xs text-slate-500">
          Compara las dos mediciones más recientes del mismo movimiento y lado; el cambio no
          constituye una conclusión clínica.
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {comparisons.map(({ prior, latest, difference }) => (
          <li
            key={`${latest.joint}:${latest.movement}:${latest.side ?? ''}`}
            className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-medium text-slate-800">
              {latest.joint} · {latest.movement}
              {latest.side ? ` (${latest.side})` : ''}
            </p>
            <p className="text-slate-600">
              {prior.degrees}° → {latest.degrees}° · Diferencia: {difference > 0 ? '+' : ''}
              {difference.toFixed(2)}°
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

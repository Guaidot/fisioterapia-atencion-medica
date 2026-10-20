import { useMyProfile } from '../../../users/ui/hooks/useUsers.js';
import { useDashboardOverview } from '../hooks/useDashboardOverview.js';

const ZONE_LABELS = {
  hombro: 'Hombro',
  rodilla: 'Rodilla',
  columna: 'Columna',
  codo: 'Codo',
  tobillo: 'Tobillo',
  cadera: 'Cadera',
  muneca: 'Muñeca',
  cuello: 'Cuello',
};

const LESION_LABELS = {
  articular: 'Articular',
  muscular: 'Muscular',
  tendinosa: 'Tendinosa',
  ligamentosa: 'Ligamentosa',
  neurologica: 'Neurológica',
  osea: 'Ósea',
};

function formatDate(value) {
  return new Date(value).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function SummaryCard({ label, value, detail, accent = 'sky' }) {
  const accents = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${accents[accent]}`}>
          {detail}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

const CHART_COLORS = [
  '#0284c7',
  '#0f766e',
  '#7c3aed',
  '#d97706',
  '#db2777',
  '#4f46e5',
  '#65a30d',
  '#475569',
];

function FrequencyPieChart({ title, items, labels, emptyMessage }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="list-panel">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Distribución según las atenciones registradas en los últimos 30 días.
        </p>
      </div>
      {total === 0 ? (
        <p className="p-5 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="grid items-center gap-5 p-5 sm:grid-cols-[minmax(150px,0.8fr)_1.2fr]">
          <div className="mx-auto w-full max-w-52">
            <svg
              viewBox="0 0 144 144"
              role="img"
              aria-label={`${title}: ${total} atenciones distribuidas en ${items.length} categorías`}
              className="w-full"
            >
              <circle cx="72" cy="72" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="28" />
              {items.map((item, index) => {
                const segmentLength = (item.count / total) * circumference;
                const currentOffset = offset;
                offset += segmentLength;
                return (
                  <circle
                    key={item.value}
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth="28"
                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                    strokeDashoffset={-currentOffset}
                    transform="rotate(-90 72 72)"
                  />
                );
              })}
              <text
                x="72"
                y="68"
                textAnchor="middle"
                className="fill-slate-900 text-2xl font-semibold"
              >
                {total}
              </text>
              <text
                x="72"
                y="85"
                textAnchor="middle"
                className="fill-slate-500 text-[8px]"
              >
                atenciones
              </text>
            </svg>
          </div>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={item.value} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-700">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{labels[item.value] ?? item.value}</span>
                </span>
                <span className="shrink-0 text-slate-500">
                  {item.count} <span className="text-xs">({Math.round((item.count / total) * 100)}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const { data: profile } = useMyProfile();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardOverview();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Preparando el resumen de la clínica…</p>;
  }

  if (isError) {
    return (
      <section className="list-panel p-6">
        <h1 className="text-lg font-semibold text-slate-800">No se pudo cargar el resumen</h1>
        <p role="alert" className="mt-2 text-sm text-red-700">{error.message}</p>
        <button type="button" className="btn-primary mt-4 min-h-11" onClick={() => refetch()}>
          Intentar de nuevo
        </button>
      </section>
    );
  }

  const mostFrequentZone = data.frequentZones[0];
  const mostFrequentLesion = data.frequentLesions[0];

  return (
    <section className="mx-auto w-full max-w-screen-2xl space-y-5 sm:space-y-6">
      <header className="page-heading">
        <div>
          <p className="text-sm font-medium text-brand-700">Resumen de la clínica</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
            Hola{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="page-description">
            Indicadores descriptivos basados en los registros clínicos existentes.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pacientes activos"
          value={data.activePatients}
          detail="Actualmente"
          accent="sky"
        />
        <SummaryCard
          label="Atenciones registradas"
          value={data.evaluationsCount}
          detail={`Últimos ${data.periodDays} días`}
          accent="teal"
        />
        <SummaryCard
          label="Zona más registrada"
          value={mostFrequentZone ? ZONE_LABELS[mostFrequentZone.value] ?? mostFrequentZone.value : '—'}
          detail={mostFrequentZone ? `${mostFrequentZone.count} atenciones` : 'Sin datos'}
          accent="violet"
        />
        <SummaryCard
          label="Tipo de lesión más registrado"
          value={mostFrequentLesion ? LESION_LABELS[mostFrequentLesion.value] ?? mostFrequentLesion.value : '—'}
          detail={mostFrequentLesion ? `${mostFrequentLesion.count} atenciones` : 'Sin datos'}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FrequencyPieChart
          title="Zonas anatómicas más registradas"
          items={data.frequentZones}
          labels={ZONE_LABELS}
          emptyMessage="Aún no hay atenciones para este período."
        />
        <FrequencyPieChart
          title="Tipos de lesión más registrados"
          items={data.frequentLesions}
          labels={LESION_LABELS}
          emptyMessage="Aún no hay atenciones para este período."
        />
      </div>

      <section className="list-panel">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Actividad reciente</h2>
            <p className="mt-1 text-xs text-slate-500">
              Últimas evaluaciones clínicas registradas; no representa citas ni asistencia.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost min-h-10 self-start"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
        {data.recentActivity.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No hay atenciones registradas en los últimos 30 días.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentActivity.map((item, index) => (
              <li key={`${item.createdAt}-${index}`} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {ZONE_LABELS[item.zone] ?? item.zone} · {LESION_LABELS[item.lesionType] ?? item.lesionType}
                  </p>
                  <p className="text-xs text-slate-500">Evaluación clínica registrada</p>
                </div>
                <time className="text-xs text-slate-400" dateTime={item.createdAt}>
                  {formatDate(item.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs leading-5 text-slate-400">
        Los conteos describen los datos registrados y no generan conclusiones clínicas. “Atenciones”
        corresponde a evaluaciones clínicas guardadas; las citas y asistencias se incorporarán con la agenda.
      </p>
    </section>
  );
}

import { useAuditEvents } from '../hooks/useAuditEvents.js';

const ACTION_LABELS = {
  INSERT: 'Creación',
  UPDATE: 'Edición',
  DELETE: 'Borrado permanente',
};

const ENTITY_LABELS = {
  patient: 'Paciente',
  clinical_evaluation: 'Evaluación clínica',
};

function formatDate(value) {
  return new Date(value).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AuditLogPage() {
  const { data: events = [], isLoading, isError, error } = useAuditEvents();

  return (
    <section className="mx-auto w-full max-w-screen-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 lg:text-3xl">
          Auditoría clínica
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro de cambios en pacientes y evaluaciones. Solo visible para administradores.
        </p>
      </header>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Cargando auditoría…</p>
        ) : isError ? (
          <p role="alert" className="p-5 text-sm text-red-700">
            No se pudo cargar la auditoría: {error.message}
          </p>
        ) : events.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Todavía no hay cambios registrados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((event) => (
              <li key={event.id} className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {ACTION_LABELS[event.action]} · {ENTITY_LABELS[event.entityType]}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      Registro: {event.recordId}
                      {event.patientId && event.entityType === 'clinical_evaluation'
                        ? ` · Paciente: ${event.patientId}`
                        : ''}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {event.actorName || event.actorEmail || 'Usuario no disponible'}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-slate-500 sm:text-right"
                    dateTime={event.occurredAt}
                  >
                    {formatDate(event.occurredAt)}
                  </time>
                </div>

                <details className="rounded-lg border border-slate-200 bg-slate-50">
                  <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-medium text-slate-700">
                    Ver detalle del cambio
                  </summary>
                  <div className="grid gap-3 border-t border-slate-200 p-3 lg:grid-cols-2">
                    {event.oldData && (
                      <div className="min-w-0">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Antes
                        </h2>
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs text-slate-700">
                          {JSON.stringify(event.oldData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {event.newData && (
                      <div className="min-w-0">
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Después
                        </h2>
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs text-slate-700">
                          {JSON.stringify(event.newData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

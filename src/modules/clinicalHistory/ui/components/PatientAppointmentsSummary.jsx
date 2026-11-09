const STATUS_LABELS = {
  scheduled: 'Programada',
  attended: 'Atendida',
  no_show: 'Inasistencia',
  rescheduled: 'Reprogramada',
  cancelled: 'Cancelada',
};

const STATUS_STYLES = {
  scheduled: 'bg-sky-50 text-sky-700',
  attended: 'bg-emerald-50 text-emerald-700',
  no_show: 'bg-rose-50 text-rose-700',
  rescheduled: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

function formatAppointmentDate(value) {
  return new Date(value).toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function PatientAppointmentsSummary({ appointmentsQuery, onSchedule }) {
  const appointments = (appointmentsQuery.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  return (
    <section className="list-panel">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-semibold text-slate-800">Citas relacionadas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Las citas se muestran aparte de las evaluaciones clínicas.
          </p>
        </div>
        <button type="button" className="btn-primary min-h-11" onClick={onSchedule}>
          Programar próxima cita
        </button>
      </div>
      {appointmentsQuery.isLoading ? (
        <p className="p-5 text-sm text-slate-500">Cargando citas…</p>
      ) : appointmentsQuery.isError ? (
        <p role="alert" className="p-5 text-sm text-red-700">
          No se pudieron cargar las citas: {appointmentsQuery.error.message}
        </p>
      ) : appointments.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No hay citas registradas para este paciente.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {formatAppointmentDate(appointment.scheduledAt)}
                  {appointment.durationMinutes ? ` · ${appointment.durationMinutes} min` : ''}
                </p>
                {appointment.clinicalEvaluationId && (
                  <p className="text-xs text-slate-500">Vinculada a una evaluación clínica</p>
                )}
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}
              >
                {STATUS_LABELS[appointment.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

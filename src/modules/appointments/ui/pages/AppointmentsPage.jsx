import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../../patients/ui/hooks/usePatients.js';
import { useAppointments, useAppointmentActions } from '../hooks/useAppointments.js';
import { clinicDateTimeToIso } from '../../../../shared/ui/clinicDateTime.js';

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

const FILTERS = [
  { value: 'scheduled', label: 'Programadas' },
  { value: 'all', label: 'Todas' },
  { value: 'attended', label: 'Atendidas' },
  { value: 'no_show', label: 'Inasistencias' },
  { value: 'rescheduled', label: 'Reprogramadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

const EMPTY_FORM = { patientId: '', scheduledAt: '', durationMinutes: '' };

function displayDate(value) {
  return new Date(value).toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function patientName(appointment) {
  const patient = appointment.patient;
  return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente';
}

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentsQuery = useAppointments();
  const patientsQuery = usePatients();
  const actions = useAppointmentActions();
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    patientId: searchParams.get('patientId') ?? '',
  });
  const [filter, setFilter] = useState('scheduled');
  const [rebookingId, setRebookingId] = useState(null);
  const [rebookForm, setRebookForm] = useState({ scheduledAt: '', durationMinutes: '' });
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const isPending = actions.create.isPending || actions.updateStatus.isPending || actions.reschedule.isPending;

  const appointments = appointmentsQuery.data ?? [];
  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => filter === 'all' || appointment.status === filter),
    [appointments, filter],
  );

  function durationValue(value) {
    if (value === '') return null;
    const duration = Number(value);
    if (!Number.isInteger(duration) || duration < 5 || duration > 1440) {
      throw new Error('La duración debe ser de 5 a 1440 minutos.');
    }
    return duration;
  }

  async function submitAppointment(event) {
    event.preventDefault();
    setError('');
    setFeedback('');
    try {
      if (!form.patientId) throw new Error('Selecciona el paciente.');
      await actions.create.mutateAsync({
        patientId: form.patientId,
        scheduledAt: clinicDateTimeToIso(form.scheduledAt),
        durationMinutes: durationValue(form.durationMinutes),
      });
      setForm({ ...EMPTY_FORM });
      setFeedback('Cita programada.');
    } catch (submitError) {
      setError(submitError.message || 'No se pudo programar la cita.');
    }
  }

  async function changeStatus(id, status) {
    setError('');
    setFeedback('');
    try {
      await actions.updateStatus.mutateAsync({ id, status });
      setFeedback(status === 'cancelled' ? 'Cita cancelada.' : 'Inasistencia registrada.');
    } catch (statusError) {
      setError(statusError.message || 'No se pudo actualizar la cita.');
    }
  }

  async function submitReschedule(event, appointment) {
    event.preventDefault();
    setError('');
    setFeedback('');
    try {
      const replacement = await actions.reschedule.mutateAsync({
        id: appointment.id,
        scheduledAt: clinicDateTimeToIso(rebookForm.scheduledAt),
        durationMinutes: durationValue(rebookForm.durationMinutes),
      });
      setRebookingId(null);
      setRebookForm({ scheduledAt: '', durationMinutes: '' });
      setFeedback(`Cita reprogramada para ${displayDate(replacement.scheduledAt)}.`);
    } catch (rebookError) {
      setError(rebookError.message || 'No se pudo reprogramar la cita.');
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Agenda y asistencia</h1>
          <p className="page-description">
            Programa las citas y registra su resultado. Una cita atendida solo se vincula a una
            evaluación cuando guardas la atención.
          </p>
        </div>
      </header>

      <form onSubmit={submitAppointment} className="card space-y-4">
        <h2 className="font-semibold text-slate-800">Programar cita</h2>
        {patientsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Cargando pacientes…</p>
        ) : patientsQuery.isError ? (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron cargar los pacientes: {patientsQuery.error.message}
          </p>
        ) : patientsQuery.data.length === 0 ? (
          <p className="text-sm text-slate-600">
            Primero registra un paciente para poder programar una cita.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm text-slate-700">
                <span className="label">Paciente</span>
                <select
                  className="input min-h-11"
                  required
                  value={form.patientId}
                  onChange={(event) => setForm({ ...form, patientId: event.target.value })}
                >
                  <option value="">Selecciona un paciente</option>
                  {patientsQuery.data.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} · {patient.cedula}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                <span className="label">Fecha y hora (Caracas)</span>
                <input
                  className="input min-h-11"
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                  onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
                />
              </label>
              <label className="block text-sm text-slate-700">
                <span className="label">Duración en minutos (opcional)</span>
                <input
                  className="input min-h-11"
                  type="number"
                  min="5"
                  max="1440"
                  step="1"
                  value={form.durationMinutes}
                  onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary min-h-11" disabled={isPending}>
              {actions.create.isPending ? 'Guardando…' : 'Programar cita'}
            </button>
          </>
        )}
      </form>

      <section className="list-panel">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold text-slate-800">Citas</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Las fechas se muestran en la zona horaria de Caracas.
            </p>
          </div>
          <label className="text-sm text-slate-700">
            <span className="sr-only">Filtrar citas por estado</span>
            <select
              className="input min-h-11 sm:min-w-48"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        {appointmentsQuery.isLoading ? (
          <p className="p-5 text-sm text-slate-500">Cargando citas…</p>
        ) : appointmentsQuery.isError ? (
          <p role="alert" className="p-5 text-sm text-red-700">
            No se pudieron cargar las citas: {appointmentsQuery.error.message}
          </p>
        ) : visibleAppointments.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            {filter === 'scheduled' ? 'No hay citas programadas.' : 'No hay citas para este filtro.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleAppointments.map((appointment) => {
              const isOverdue =
                appointment.status === 'scheduled' &&
                Date.parse(appointment.scheduledAt) < Date.now();
              return (
                <li key={appointment.id} className="space-y-3 p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{patientName(appointment)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {displayDate(appointment.scheduledAt)}
                        {appointment.durationMinutes ? ` · ${appointment.durationMinutes} min` : ''}
                      </p>
                      {appointment.patient?.cedula && (
                        <p className="text-xs text-slate-500">Cédula: {appointment.patient.cedula}</p>
                      )}
                      {appointment.rescheduledFromId && (
                        <p className="mt-1 text-xs text-amber-700">Nueva fecha de una cita reprogramada</p>
                      )}
                      {appointment.rescheduledToId && (
                        <p className="mt-1 text-xs text-amber-700">
                          Reprogramada para el historial de esta agenda
                        </p>
                      )}
                      {appointment.clinicalEvaluationId && (
                        <Link
                          className="mt-1 inline-block text-xs font-medium text-brand-700 hover:underline"
                          to={`/pacientes/${appointment.patientId}`}
                        >
                          Ver historial de atención
                        </Link>
                      )}
                      {isOverdue && (
                        <p className="mt-1 text-xs font-medium text-rose-700">
                          Fecha vencida; confirma si se atendió o registra la inasistencia.
                        </p>
                      )}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}>
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </div>

                  {appointment.status === 'scheduled' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary min-h-10"
                        onClick={() =>
                          navigate(`/pacientes/${appointment.patientId}?appointmentId=${appointment.id}&newEvaluation=1`)
                        }
                      >
                        Registrar atención
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-10"
                        onClick={() => {
                          setRebookingId(appointment.id);
                          setRebookForm({ scheduledAt: '', durationMinutes: '' });
                          setError('');
                        }}
                      >
                        Reprogramar
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-10"
                        disabled={isPending}
                        onClick={() => changeStatus(appointment.id, 'no_show')}
                      >
                        Registrar inasistencia
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-10"
                        disabled={isPending}
                        onClick={() => changeStatus(appointment.id, 'cancelled')}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {rebookingId === appointment.id && (
                    <form
                      onSubmit={(event) => submitReschedule(event, appointment)}
                      className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
                    >
                      <label className="block text-sm text-slate-700">
                        <span className="label">Nueva fecha y hora (Caracas)</span>
                        <input
                          className="input min-h-11"
                          type="datetime-local"
                          required
                          value={rebookForm.scheduledAt}
                          onChange={(event) =>
                            setRebookForm({ ...rebookForm, scheduledAt: event.target.value })
                          }
                        />
                      </label>
                      <label className="block text-sm text-slate-700">
                        <span className="label">Duración en minutos (opcional)</span>
                        <input
                          className="input min-h-11"
                          type="number"
                          min="5"
                          max="1440"
                          value={rebookForm.durationMinutes}
                          onChange={(event) =>
                            setRebookForm({ ...rebookForm, durationMinutes: event.target.value })
                          }
                        />
                      </label>
                      <button type="submit" className="btn-primary min-h-11" disabled={isPending}>
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="btn-ghost min-h-11"
                        onClick={() => setRebookingId(null)}
                      >
                        Cerrar
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {feedback && <p role="status" className="text-sm text-emerald-700">{feedback}</p>}
    </section>
  );
}

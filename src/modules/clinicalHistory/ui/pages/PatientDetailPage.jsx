import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../../patients/ui/hooks/usePatients.js';
import {
  useClinicalHistories,
  useCreateClinicalHistory,
  useUpdateClinicalHistory,
} from '../hooks/useClinicalHistories.js';
import { TextField, SelectField } from '../../../../shared/ui/components/Fields.jsx';
import {
  LESION_TYPES,
  ANATOMICAL_ZONES,
  EVOLUTION_PHASES,
  VITAL_SIGN_FIELDS,
} from '../../domain/entities/ClinicalHistory.js';
import { EvaluationTreatmentPanel } from '../../../treatment/ui/components/EvaluationTreatmentPanel.jsx';
import { RomProgressSummary } from '../../../treatment/ui/components/RomProgressSummary.jsx';
import { EvaProgressChart } from '../components/EvaProgressChart.jsx';
import { PatientAppointmentsSummary } from '../components/PatientAppointmentsSummary.jsx';
import { useAppointments } from '../../../appointments/ui/hooks/useAppointments.js';
import { useMyProfile } from '../../../users/ui/hooks/useUsers.js';
import { can } from '../../../users/domain/permissions.js';
import {
  clinicDateTimeToIso,
  currentClinicDateTime,
  formatClinicDateTime,
} from '../../../../shared/ui/clinicDateTime.js';
import { z } from 'zod';
import { Pagination } from '../../../../shared/ui/components/Pagination.jsx';
import { usePagination } from '../../../../shared/ui/hooks/usePagination.js';

function numericField({ pattern, message, min, max, integer = false }) {
  let numberSchema = z.number({ invalid_type_error: message }).min(min, message);
  if (max !== undefined) numberSchema = numberSchema.max(max, message);
  if (integer) numberSchema = numberSchema.int(message);

  return z.preprocess(
    (value) => {
      if (value === '') return undefined;
      if (typeof value !== 'string' || !pattern.test(value)) return Number.NaN;
      return Number(value);
    },
    numberSchema.optional(),
  );
}

export const historySchema = z
  .object({
    diagnosis: z
      .string()
      .trim()
      .min(1, 'El diagnóstico es obligatorio.')
      .max(1000, 'El diagnóstico no puede superar 1000 caracteres.'),
    lesionType: z.enum(LESION_TYPES, { message: 'Seleccione el tipo de lesión.' }),
    zone: z.enum(ANATOMICAL_ZONES, { message: 'Seleccione la zona anatómica.' }),
    phase: z.enum(EVOLUTION_PHASES, { message: 'Seleccione la fase de evolución.' }),
    evaScore: numericField({
      pattern: /^\d+$/,
      message: 'La escala EVA debe ser un número entero entre 0 y 10.',
      min: 0,
      max: 10,
      integer: true,
    }),
    clinicalObservations: z.string().max(2000, 'Las observaciones no pueden superar 2000 caracteres.'),
    vitalsMeasuredAt: z.string().refine((value) => {
      if (value === '') return true;
      try {
        clinicDateTimeToIso(value);
        return true;
      } catch (error) {
        if (error instanceof RangeError) return false;
        throw error;
      }
    }, 'Indica una fecha y hora válida en la zona de la clínica.'),
    bloodPressureSystolic: numericField({
      pattern: /^\d+$/,
      message: 'La presión sistólica debe ser un entero positivo.',
      min: 1,
      integer: true,
    }),
    bloodPressureDiastolic: numericField({
      pattern: /^\d+$/,
      message: 'La presión diastólica debe ser un entero positivo.',
      min: 1,
      integer: true,
    }),
    oxygenSaturation: numericField({
      pattern: /^\d+(?:\.\d{1,2})?$/,
      message: 'La saturación debe ser un número entre 0 y 100, con máximo 2 decimales.',
      min: 0,
      max: 100,
    }),
    temperatureCelsius: numericField({
      pattern: /^\d+(?:\.\d{1,2})?$/,
      message: 'La temperatura debe ser positiva, no superar 99.99 °C y tener máximo 2 decimales.',
      min: Number.MIN_VALUE,
      max: 99.99,
    }),
    heartRate: numericField({
      pattern: /^\d+$/,
      message: 'La frecuencia cardíaca debe ser un entero positivo.',
      min: 1,
      integer: true,
    }),
    sleepHours: z.union([z.literal(''), z.enum(['menos_4', '4_6', '6_8', 'mas_8'])]),
    sleepQuality: z.union([z.literal(''), z.enum(['interrumpido', 'superficial', 'reparador'])]),
    bloodPressureMedications: z.array(
      z.enum(['captopril', 'enalapril', 'losartan', 'amlodipina', 'otro']),
    ),
    otherBloodPressureMedication: z.string().max(200),
    otherMedication: z.string().max(1000),
  })
  .superRefine((data, context) => {
    if (
      (data.bloodPressureSystolic === undefined) !==
      (data.bloodPressureDiastolic === undefined)
    ) {
      const field =
        data.bloodPressureSystolic === undefined
          ? 'bloodPressureSystolic'
          : 'bloodPressureDiastolic';
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: 'Ingresa ambos valores de la tensión arterial.',
      });
    }

    if (
      data.bloodPressureMedications.includes('otro') &&
      !data.otherBloodPressureMedication.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherBloodPressureMedication'],
        message: 'Indica el medicamento para la presión.',
      });
    }
  });

const BLOOD_PRESSURE_MEDICATIONS = [
  { value: 'captopril', label: 'Captopril' },
  { value: 'enalapril', label: 'Enalapril' },
  { value: 'losartan', label: 'Losartán' },
  { value: 'amlodipina', label: 'Amlodipina' },
  { value: 'otro', label: 'Otro' },
];

const SLEEP_HOURS_OPTIONS = [
  { value: 'menos_4', label: 'Menos de 4 horas' },
  { value: '4_6', label: '4 a 6 horas' },
  { value: '6_8', label: '6 a 8 horas' },
  { value: 'mas_8', label: 'Más de 8 horas' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 'interrumpido', label: 'Interrumpido' },
  { value: 'superficial', label: 'Superficial' },
  { value: 'reparador', label: 'Reparador' },
];

const LABELS = {
  lesionType: {
    articular: 'Articular',
    muscular: 'Muscular',
    tendinosa: 'Tendinosa',
    ligamentosa: 'Ligamentosa',
    neurologica: 'Neurológica',
    osea: 'Ósea',
  },
  zone: {
    hombro: 'Hombro',
    rodilla: 'Rodilla',
    columna: 'Columna',
    codo: 'Codo',
    tobillo: 'Tobillo',
    cadera: 'Cadera',
    muneca: 'Muñeca',
    cuello: 'Cuello',
  },
  phase: { aguda: 'Aguda', subaguda: 'Subaguda', cronica: 'Crónica' },
};

const PHASE_STYLE = {
  aguda: 'bg-red-50 text-red-700',
  subaguda: 'bg-amber-50 text-amber-700',
  cronica: 'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = {
  diagnosis: '',
  lesionType: '',
  zone: '',
  phase: '',
  evaScore: '',
  clinicalObservations: '',
  vitalsMeasuredAt: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  oxygenSaturation: '',
  temperatureCelsius: '',
  heartRate: '',
  sleepHours: '',
  sleepQuality: '',
  bloodPressureMedications: [],
  otherBloodPressureMedication: '',
  otherMedication: '',
};

function formFromHistory(history) {
  return {
    diagnosis: history.diagnosis ?? '',
    lesionType: history.lesionType ?? '',
    zone: history.zone ?? '',
    phase: history.phase ?? '',
    evaScore: history.evaScore == null ? '' : String(history.evaScore),
    clinicalObservations: history.clinicalObservations ?? '',
    vitalsMeasuredAt: formatClinicDateTime(history.vitalsMeasuredAt),
    bloodPressureSystolic: history.bloodPressureSystolic == null
      ? ''
      : String(history.bloodPressureSystolic),
    bloodPressureDiastolic: history.bloodPressureDiastolic == null
      ? ''
      : String(history.bloodPressureDiastolic),
    oxygenSaturation: history.oxygenSaturation == null ? '' : String(history.oxygenSaturation),
    temperatureCelsius: history.temperatureCelsius == null
      ? ''
      : String(history.temperatureCelsius),
    heartRate: history.heartRate == null ? '' : String(history.heartRate),
    sleepHours: history.sleepHours ?? '',
    sleepQuality: history.sleepQuality ?? '',
    bloodPressureMedications: history.bloodPressureMedications ?? [],
    otherBloodPressureMedication: history.otherBloodPressureMedication ?? '',
    otherMedication: history.otherMedication ?? '',
  };
}

export function PatientDetailPage({ patientId: patientIdProp, embedded = false }) {
  const { id } = useParams();
  const patientId = patientIdProp ?? id;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const { data: currentProfile } = useMyProfile();
  const agendaAccess = can(currentProfile?.role, 'agenda');
  const appointmentsQuery = useAppointments(agendaAccess);
  const { data: patients = [] } = usePatients();
  const patient = patients.find((p) => p.id === patientId);

  const { data: histories = [], isLoading } = useClinicalHistories(patientId);
  const historyPagination = usePagination(histories, patientId);
  const createHistory = useCreateClinicalHistory();
  const updateHistory = useUpdateClinicalHistory();

  const [showForm, setShowForm] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      delete next._root;
      return next;
    });
  }

  function startNewEvaluation() {
    setEditingHistoryId(null);
    setForm({ ...EMPTY_FORM, vitalsMeasuredAt: currentClinicDateTime() });
    setErrors({});
    setShowForm(true);
  }

  function startEditingHistory(history) {
    setEditingHistoryId(history.id);
    setForm(formFromHistory(history));
    setErrors({});
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingHistoryId(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    if (searchParams.has('appointmentId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('appointmentId');
      nextParams.delete('newEvaluation');
      setSearchParams(nextParams, { replace: true });
    }
  }

  useEffect(() => {
    if (searchParams.get('newEvaluation') !== '1' || !patient || showForm) return;
    setEditingHistoryId(null);
    setForm({ ...EMPTY_FORM, vitalsMeasuredAt: currentClinicDateTime() });
    setErrors({});
    setShowForm(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('newEvaluation');
    setSearchParams(nextParams, { replace: true });
  }, [patient, searchParams, setSearchParams, showForm]);

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = historySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const existingEvaluation = histories.find((history) => history.id === editingHistoryId);
    const hasVitals = VITAL_SIGN_FIELDS.some((field) => parsed.data[field] != null);
    const vitalsChanged = VITAL_SIGN_FIELDS.some(
      (field) => (parsed.data[field] ?? null) !== (existingEvaluation?.[field] ?? null),
    );
    if (
      hasVitals &&
      !parsed.data.vitalsMeasuredAt &&
      (!existingEvaluation || existingEvaluation.vitalsMeasuredAt || vitalsChanged)
    ) {
      setErrors({
        vitalsMeasuredAt: 'Indica cuándo se midieron los signos vitales.',
      });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const input = {
        ...parsed.data,
        evaScore: parsed.data.evaScore ?? null,
        clinicalObservations: parsed.data.clinicalObservations.trim(),
        vitalsMeasuredAt:
          hasVitals && parsed.data.vitalsMeasuredAt
            ? clinicDateTimeToIso(parsed.data.vitalsMeasuredAt)
            : null,
        sleepHours: parsed.data.sleepHours || null,
        sleepQuality: parsed.data.sleepQuality || null,
        patientId,
        appointmentId: editingHistoryId ? existingEvaluation?.appointmentId : appointmentId,
      };
      if (editingHistoryId) {
        await updateHistory.mutateAsync({ ...input, id: editingHistoryId });
      } else {
        await createHistory.mutateAsync(input);
      }
      cancelForm();
    } catch (err) {
      setErrors({ _root: err.message || 'No se pudo guardar la evaluación.' });
    } finally {
      setSaving(false);
    }
  }

  if (!patient) {
    return <p className="text-sm text-slate-500">Paciente no encontrado.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      {!embedded && (
        <button
          type="button"
          onClick={() => navigate('/pacientes')}
          className="btn-ghost !py-1 text-xs"
        >
          ← Volver a pacientes
        </button>
      )}
      {agendaAccess && (
        <PatientAppointmentsSummary
          appointmentsQuery={{
            ...appointmentsQuery,
            data: (appointmentsQuery.data ?? []).filter(
              (appointment) => appointment.patientId === patientId,
            ),
          }}
          onSchedule={() =>
            navigate(`/agenda?patientId=${encodeURIComponent(patientId)}`)
          }
        />
      )}

      <div className="page-heading !mb-0">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {patient.fullName}
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Cédula: {patient.cedula} · Edad: {patient.age ?? '—'} · {patient.gender}
            {patient.occupation ? ` · ${patient.occupation}` : ''}
            {patient.phone ? ` · ${patient.phone}` : ''}
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary min-h-11 w-full !px-4 !py-2 text-sm sm:w-auto"
            onClick={showForm ? cancelForm : startNewEvaluation}
          >
            {showForm
              ? editingHistoryId
                ? 'Cancelar edición'
                : 'Cancelar nueva evaluación'
              : '+ Nueva evaluación clínica'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 p-4 sm:p-5">
          <h2 className="font-semibold text-slate-700">
            {editingHistoryId ? 'Editar evaluación clínica' : 'Nueva evaluación clínica'}
          </h2>
          <TextField
            label="Diagnóstico médico / patología principal"
            maxLength={1000}
            value={form.diagnosis}
            onChange={(e) => set('diagnosis', e.target.value)}
            error={errors.diagnosis}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Tipo de lesión"
              placeholder="Seleccione el tipo de lesión"
              value={form.lesionType}
              onChange={(e) => set('lesionType', e.target.value)}
              options={Object.entries(LABELS.lesionType).map(([value, label]) => ({ value, label }))}
              error={errors.lesionType}
            />
            <SelectField
              label="Zona anatómica"
              placeholder="Seleccione la zona anatómica"
              value={form.zone}
              onChange={(e) => set('zone', e.target.value)}
              options={Object.entries(LABELS.zone).map(([value, label]) => ({ value, label }))}
              error={errors.zone}
            />
            <SelectField
              label="Fase de evolución"
              placeholder="Seleccione la fase de evolución"
              value={form.phase}
              onChange={(e) => set('phase', e.target.value)}
              options={Object.entries(LABELS.phase).map(([value, label]) => ({ value, label }))}
              error={errors.phase}
            />
          </div>
          <div className="max-w-xs">
            <TextField
              label="Dolor (EVA 0-10)"
              type="number"
              min="0"
              max="10"
              step="1"
              inputMode="numeric"
              value={form.evaScore}
              onChange={(e) => set('evaScore', e.target.value)}
              error={errors.evaScore}
              hint={form.evaScore ? `${Number(form.evaScore)}/10` : undefined}
            />
          </div>
          <label className="block text-sm text-slate-700">
            <span className="label">Observaciones clínicas</span>
            <textarea
              className="input min-h-24"
              maxLength={2000}
              value={form.clinicalObservations}
              onChange={(event) => set('clinicalObservations', event.target.value)}
            />
            {errors.clinicalObservations && (
              <span className="mt-1 block text-xs text-red-600">{errors.clinicalObservations}</span>
            )}
          </label>
          <details open={Boolean(editingHistoryId)} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-slate-700">
              Triaje, signos vitales y antecedentes
            </summary>
            <div className="mt-4 space-y-5">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Signos vitales</h3>
                <div className="mb-3 max-w-sm">
                  <TextField
                    label="Fecha y hora de medición (hora de Caracas)"
                    type="datetime-local"
                    value={form.vitalsMeasuredAt}
                    onChange={(event) => set('vitalsMeasuredAt', event.target.value)}
                    error={errors.vitalsMeasuredAt}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <TextField
                    label="Presión sistólica (mmHg)"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.bloodPressureSystolic}
                    onChange={(e) => set('bloodPressureSystolic', e.target.value)}
                    error={errors.bloodPressureSystolic}
                  />
                  <TextField
                    label="Presión diastólica (mmHg)"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.bloodPressureDiastolic}
                    onChange={(e) => set('bloodPressureDiastolic', e.target.value)}
                    error={errors.bloodPressureDiastolic}
                  />
                  <TextField
                    label="Saturación de oxígeno (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={form.oxygenSaturation}
                    onChange={(e) => set('oxygenSaturation', e.target.value)}
                    error={errors.oxygenSaturation}
                  />
                  <TextField
                    label="Temperatura (°C)"
                    type="number"
                    min="0.01"
                    max="99.99"
                    step="0.01"
                    inputMode="decimal"
                    value={form.temperatureCelsius}
                    onChange={(e) => set('temperatureCelsius', e.target.value)}
                    error={errors.temperatureCelsius}
                  />
                  <TextField
                    label="Frecuencia cardíaca (lpm)"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.heartRate}
                    onChange={(e) => set('heartRate', e.target.value)}
                    error={errors.heartRate}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Sueño y medicamentos</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Horas de sueño"
                    placeholder="Seleccione"
                    value={form.sleepHours}
                    onChange={(e) => set('sleepHours', e.target.value)}
                    options={SLEEP_HOURS_OPTIONS}
                    error={errors.sleepHours}
                  />
                  <SelectField
                    label="Calidad del sueño"
                    placeholder="Seleccione"
                    value={form.sleepQuality}
                    onChange={(e) => set('sleepQuality', e.target.value)}
                    options={SLEEP_QUALITY_OPTIONS}
                    error={errors.sleepQuality}
                  />
                </div>
                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium text-slate-700">
                    Medicamentos para la presión arterial
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {BLOOD_PRESSURE_MEDICATIONS.map((medication) => (
                      <label
                        key={medication.value}
                        className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.bloodPressureMedications.includes(medication.value)}
                          onChange={(event) => {
                            const selected = event.target.checked
                              ? [...form.bloodPressureMedications, medication.value]
                              : form.bloodPressureMedications.filter(
                                  (value) => value !== medication.value,
                                );
                            set('bloodPressureMedications', selected);
                          }}
                          className="size-4 accent-brand-600"
                        />
                        {medication.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {form.bloodPressureMedications.includes('otro') && (
                  <div className="mt-3">
                    <TextField
                      label="Indique otro medicamento para la presión"
                      value={form.otherBloodPressureMedication}
                      onChange={(e) => set('otherBloodPressureMedication', e.target.value)}
                      error={errors.otherBloodPressureMedication}
                    />
                  </div>
                )}
                <div className="mt-4">
                  <TextField
                    label="Otros medicamentos de uso regular"
                    value={form.otherMedication}
                    onChange={(e) => set('otherMedication', e.target.value)}
                    error={errors.otherMedication}
                  />
                </div>
              </section>
            </div>
          </details>
          {errors._root && <p className="text-sm text-red-600">{errors._root}</p>}
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button type="button" className="btn-ghost min-h-11" onClick={cancelForm} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary min-h-11 w-full sm:w-auto" disabled={saving}>
              {saving ? 'Guardando…' : editingHistoryId ? 'Guardar cambios' : 'Guardar evaluación'}
            </button>
          </div>
        </form>
      )}

      {histories.length > 1 && <RomProgressSummary clinicalEvaluations={histories} />}
      <EvaProgressChart evaluations={histories} />

      <div className="list-panel">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
          Evaluaciones clínicas ({histories.length})
          </h2>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Cargando…</p>
        ) : histories.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Sin evaluaciones registradas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {historyPagination.visibleItems.map((h) => (
              <li
                key={h.id}
                className="flex flex-col gap-2 px-4 py-4 text-sm sm:px-5"
              >
                <div>
                  <p className="font-medium text-slate-800">{h.diagnosis}</p>
                  {h.clinicalObservations && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">
                      {h.clinicalObservations}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {h.zone} · Tipo: {h.lesionType} · Fase:{' '}
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PHASE_STYLE[h.phase]}`}>
                      {LABELS.phase[h.phase]}
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  {h.evaScore != null && (
                    <p className="font-semibold text-brand-700">EVA {h.evaScore}/10</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {formatClinicDateTime(h.createdAt).replace('T', ' ')}
                  </p>
                </div>
                {(h.bloodPressureSystolic ||
                  h.bloodPressureDiastolic ||
                  h.oxygenSaturation != null ||
                  h.temperatureCelsius != null ||
                  h.heartRate ||
                  h.sleepHours ||
                  h.sleepQuality ||
                  h.bloodPressureMedications?.length ||
                  h.otherMedication) && (
                  <p className="mt-2 text-xs text-slate-500">
                    {h.bloodPressureSystolic && h.bloodPressureDiastolic
                      ? `TA ${h.bloodPressureSystolic}/${h.bloodPressureDiastolic} mmHg · `
                      : ''}
                    {h.oxygenSaturation != null ? `SpO₂ ${h.oxygenSaturation}% · ` : ''}
                    {h.temperatureCelsius != null ? `Temp. ${h.temperatureCelsius} °C · ` : ''}
                    {h.heartRate ? `FC ${h.heartRate} lpm · ` : ''}
                    {h.vitalsMeasuredAt
                      ? `Medición: ${formatClinicDateTime(h.vitalsMeasuredAt).replace('T', ' ')} · `
                      : ''}
                    {h.sleepHours
                      ? `Sueño: ${
                          {
                            menos_4: '< 4',
                            '4_6': '4–6',
                            '6_8': '6–8',
                            mas_8: '> 8',
                          }[h.sleepHours]
                        } h · `
                      : ''}
                    {h.sleepQuality ? `Calidad: ${h.sleepQuality} · ` : ''}
                    {h.bloodPressureMedications?.length
                      ? `Medicamentos TA: ${h.bloodPressureMedications
                          .map(
                            (medication) =>
                              ({
                                captopril: 'Captopril',
                                enalapril: 'Enalapril',
                                losartan: 'Losartán',
                                amlodipina: 'Amlodipina',
                                otro: 'Otro',
                              })[medication] ?? medication,
                          )
                          .join(', ')} ${
                          h.otherBloodPressureMedication || ''
                        } · `
                      : ''}
                    {h.otherMedication ? `Otros medicamentos: ${h.otherMedication}` : ''}
                  </p>
                )}
                <div className="sm:ml-auto">
                  <button
                    type="button"
                    className="btn-ghost min-h-10 !px-3 !py-2 text-sm"
                    onClick={() => startEditingHistory(h)}
                    aria-label={`Editar evaluación de ${new Date(h.createdAt).toLocaleDateString('es-ES')}`}
                  >
                    Editar evaluación
                  </button>
                </div>
                <div className="w-full">
                  <EvaluationTreatmentPanel
                    clinicalEvaluationId={h.id}
                    patient={patient}
                    evaluation={h}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        {!isLoading && histories.length > 0 && (
          <Pagination
            page={historyPagination.page}
            pageSize={historyPagination.pageSize}
            totalItems={histories.length}
            onPageChange={historyPagination.setPage}
            onPageSizeChange={historyPagination.setPageSize}
          />
        )}
      </div>
    </div>
  );
}
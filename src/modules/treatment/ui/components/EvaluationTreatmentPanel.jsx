import { useState } from 'react';
import { useEvaluationTreatment } from '../hooks/useTreatment.js';
import { useContainer } from '../../../../app/container.jsx';

const EMPTY_INTERVENTION = {
  kind: 'exercise',
  name: '',
  contraction: '',
  sets: '',
  repetitions: '',
  durationSeconds: '',
  restSeconds: '',
  frequencyPerWeek: '',
  technicalFrequencyHz: '',
  intensity: '',
  intensityUnit: '',
  applicationMinutes: '',
  mode: '',
  instructions: '',
};

const EMPTY_MEASUREMENT = {
  joint: '',
  movement: '',
  side: '',
  degrees: '',
  referenceMinDegrees: '',
  referenceMaxDegrees: '',
  notes: '',
};

const CONTRACTION_LABELS = {
  isometrica: 'Isométrica',
  concentrica: 'Concéntrica',
  excentrica: 'Excéntrica',
};

function optionalNumber(value, integer = false) {
  if (value === '') return null;
  return integer ? Number.parseInt(value, 10) : Number(value);
}

function interventionPayload(form, clinicalEvaluationId) {
  const base = {
    clinicalEvaluationId,
    kind: form.kind,
    name: form.name,
    instructions: form.instructions,
  };

  if (form.kind === 'exercise') {
    return {
      ...base,
      contraction: form.contraction || null,
      sets: optionalNumber(form.sets, true),
      repetitions: optionalNumber(form.repetitions, true),
      durationSeconds: optionalNumber(form.durationSeconds, true),
      restSeconds: optionalNumber(form.restSeconds, true),
      frequencyPerWeek: optionalNumber(form.frequencyPerWeek, true),
    };
  }
  return {
    ...base,
    technicalFrequencyHz: optionalNumber(form.technicalFrequencyHz),
    intensity: optionalNumber(form.intensity),
    intensityUnit: form.intensityUnit || null,
    applicationMinutes: optionalNumber(form.applicationMinutes, true),
    mode: form.mode || null,
  };
}

function measurementPayload(form, clinicalEvaluationId) {
  return {
    clinicalEvaluationId,
    joint: form.joint,
    movement: form.movement,
    side: form.side || null,
    degrees: Number(form.degrees),
    referenceMinDegrees: optionalNumber(form.referenceMinDegrees),
    referenceMaxDegrees: optionalNumber(form.referenceMaxDegrees),
    notes: form.notes,
  };
}

function NumberInput({ label, value, onChange, min = '1', max, step = '1', required = false }) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="label">{label}</span>
      <input
        className="input min-h-11"
        type="number"
        min={min}
        max={max}
        step={step}
        required={required}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function TextInput({ label, value, onChange, required = false, maxLength = 200 }) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="label">{label}</span>
      <input
        className="input min-h-11"
        value={value}
        required={required}
        maxLength={maxLength}
        onChange={onChange}
      />
    </label>
  );
}

export function EvaluationTreatmentPanel({ clinicalEvaluationId, patient, evaluation }) {
  const [interventionForm, setInterventionForm] = useState({ ...EMPTY_INTERVENTION });
  const [measurementForm, setMeasurementForm] = useState({ ...EMPTY_MEASUREMENT });
  const [interventionError, setInterventionError] = useState('');
  const [measurementError, setMeasurementError] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportReady, setReportReady] = useState(false);
  const container = useContainer();
  const reportUseCase = container.getReportUseCases().generateHomeExercisePlan;
  const {
    interventions,
    measurements,
    createIntervention,
    createMeasurement,
  } = useEvaluationTreatment(clinicalEvaluationId);

  async function submitIntervention(event) {
    event.preventDefault();
    setInterventionError('');
    try {
      await createIntervention.mutateAsync(
        interventionPayload(interventionForm, clinicalEvaluationId),
      );
      setInterventionForm({ ...EMPTY_INTERVENTION });
    } catch (error) {
      setInterventionError(error.message || 'No se pudo guardar el tratamiento.');
    }
  }

  async function submitMeasurement(event) {
    event.preventDefault();
    setMeasurementError('');
    try {
      await createMeasurement.mutateAsync(
        measurementPayload(measurementForm, clinicalEvaluationId),
      );
      setMeasurementForm({ ...EMPTY_MEASUREMENT });
    } catch (error) {
      setMeasurementError(error.message || 'No se pudo guardar la medición.');
    }
  }

  function generateHomeExercisePlan() {
    setReportError('');
    setReportReady(false);
    try {
      reportUseCase.execute({
        patient,
        evaluation,
        interventions: interventions.data ?? [],
      });
      setReportReady(true);
    } catch (error) {
      setReportError(error.message || 'No se pudo generar la pauta.');
    }
  }

  return (
    <details className="mt-3 rounded-xl border border-slate-200 bg-white">
      <summary className="min-h-11 cursor-pointer px-4 py-3 font-medium text-slate-700">
        Tratamiento y goniometría
      </summary>
      <div className="space-y-5 border-t border-slate-200 p-4">
        <section className="space-y-3">
          <h3 className="font-semibold text-slate-800">Intervenciones terapéuticas</h3>
          <form onSubmit={submitIntervention} className="space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-700">
                <span className="label">Tipo</span>
                <select
                  className="input min-h-11"
                  value={interventionForm.kind}
                  onChange={(event) =>
                    setInterventionForm({
                      ...EMPTY_INTERVENTION,
                      kind: event.target.value,
                    })
                  }
                >
                  <option value="exercise">Ejercicio terapéutico</option>
                  <option value="physical_agent">Agente físico</option>
                </select>
              </label>
              <TextInput
                label={interventionForm.kind === 'exercise' ? 'Ejercicio' : 'Equipo o agente'}
                required
                value={interventionForm.name}
                onChange={(event) =>
                  setInterventionForm({ ...interventionForm, name: event.target.value })
                }
              />
            </div>

            {interventionForm.kind === 'exercise' ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm text-slate-700">
                  <span className="label">Tipo de contracción</span>
                  <select
                    className="input min-h-11"
                    value={interventionForm.contraction}
                    onChange={(event) =>
                      setInterventionForm({
                        ...interventionForm,
                        contraction: event.target.value,
                      })
                    }
                  >
                    <option value="">No especificada</option>
                    <option value="isometrica">Isométrica</option>
                    <option value="concentrica">Concéntrica</option>
                    <option value="excentrica">Excéntrica</option>
                  </select>
                </label>
                <NumberInput label="Series" min="1" value={interventionForm.sets} onChange={(e) => setInterventionForm({ ...interventionForm, sets: e.target.value })} />
                <NumberInput label="Repeticiones" min="1" value={interventionForm.repetitions} onChange={(e) => setInterventionForm({ ...interventionForm, repetitions: e.target.value })} />
                <NumberInput label="Duración (segundos)" min="1" value={interventionForm.durationSeconds} onChange={(e) => setInterventionForm({ ...interventionForm, durationSeconds: e.target.value })} />
                <NumberInput label="Pausa (segundos)" min="0" value={interventionForm.restSeconds} onChange={(e) => setInterventionForm({ ...interventionForm, restSeconds: e.target.value })} />
                <NumberInput label="Frecuencia (veces/semana)" min="1" value={interventionForm.frequencyPerWeek} onChange={(e) => setInterventionForm({ ...interventionForm, frequencyPerWeek: e.target.value })} />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <NumberInput label="Frecuencia técnica (Hz)" step="0.01" value={interventionForm.technicalFrequencyHz} onChange={(e) => setInterventionForm({ ...interventionForm, technicalFrequencyHz: e.target.value })} />
                <NumberInput label="Intensidad" step="0.01" value={interventionForm.intensity} onChange={(e) => setInterventionForm({ ...interventionForm, intensity: e.target.value })} />
                <label className="block text-sm text-slate-700">
                  <span className="label">Unidad de intensidad</span>
                  <select
                    className="input min-h-11"
                    value={interventionForm.intensityUnit}
                    onChange={(event) => setInterventionForm({ ...interventionForm, intensityUnit: event.target.value })}
                  >
                    <option value="">No indicada</option>
                    <option value="mA">mA</option>
                    <option value="W">W</option>
                    <option value="W/cm2">W/cm²</option>
                  </select>
                </label>
                <NumberInput label="Aplicación (minutos)" min="1" value={interventionForm.applicationMinutes} onChange={(e) => setInterventionForm({ ...interventionForm, applicationMinutes: e.target.value })} />
                <label className="block text-sm text-slate-700">
                  <span className="label">Modo</span>
                  <select
                    className="input min-h-11"
                    value={interventionForm.mode}
                    onChange={(event) => setInterventionForm({ ...interventionForm, mode: event.target.value })}
                  >
                    <option value="">No indicado</option>
                    <option value="continuo">Continuo</option>
                    <option value="pulsado">Pulsado</option>
                  </select>
                </label>
              </div>
            )}

            <label className="block text-sm text-slate-700">
              <span className="label">Indicaciones</span>
              <textarea
                className="input min-h-20"
                maxLength={2000}
                value={interventionForm.instructions}
                onChange={(event) =>
                  setInterventionForm({ ...interventionForm, instructions: event.target.value })
                }
              />
            </label>
            {interventionError && <p role="alert" className="text-sm text-red-700">{interventionError}</p>}
            <button type="submit" className="btn-primary min-h-11" disabled={createIntervention.isPending}>
              {createIntervention.isPending ? 'Guardando…' : 'Agregar intervención'}
            </button>
          </form>

          <InterventionList query={interventions} />
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-slate-800">Rangos de movimiento</h3>
          <form onSubmit={submitMeasurement} className="space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TextInput label="Articulación" maxLength={100} required value={measurementForm.joint} onChange={(e) => setMeasurementForm({ ...measurementForm, joint: e.target.value })} />
              <TextInput label="Movimiento" maxLength={100} required value={measurementForm.movement} onChange={(e) => setMeasurementForm({ ...measurementForm, movement: e.target.value })} />
              <label className="block text-sm text-slate-700">
                <span className="label">Lado</span>
                <select className="input min-h-11" value={measurementForm.side} onChange={(e) => setMeasurementForm({ ...measurementForm, side: e.target.value })}>
                  <option value="">No especificado</option>
                  <option value="izquierdo">Izquierdo</option>
                  <option value="derecho">Derecho</option>
                  <option value="bilateral">Bilateral</option>
                </select>
              </label>
              <NumberInput label="Medición (grados)" min="0" max="360" step="0.01" required value={measurementForm.degrees} onChange={(e) => setMeasurementForm({ ...measurementForm, degrees: e.target.value })} />
              <NumberInput label="Referencia mínima (°), opcional" min="0" max="360" step="0.01" value={measurementForm.referenceMinDegrees} onChange={(e) => setMeasurementForm({ ...measurementForm, referenceMinDegrees: e.target.value })} />
              <NumberInput label="Referencia máxima (°), opcional" min="0" max="360" step="0.01" value={measurementForm.referenceMaxDegrees} onChange={(e) => setMeasurementForm({ ...measurementForm, referenceMaxDegrees: e.target.value })} />
            </div>
            <label className="block text-sm text-slate-700">
              <span className="label">Observaciones</span>
              <textarea className="input min-h-20" maxLength={2000} value={measurementForm.notes} onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })} />
            </label>
            {measurementError && <p role="alert" className="text-sm text-red-700">{measurementError}</p>}
            <button type="submit" className="btn-primary min-h-11" disabled={createMeasurement.isPending}>
              {createMeasurement.isPending ? 'Guardando…' : 'Registrar medición'}
            </button>
          </form>
          <MeasurementList query={measurements} />
        </section>

        <section className="border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-slate-800">Pauta domiciliaria</h3>
          <p className="mt-1 text-sm text-slate-500">
            Abre una vista imprimible con los ejercicios prescritos. Desde el diálogo de impresión,
            elige “Guardar como PDF”.
          </p>
          <button
            type="button"
            className="btn-primary mt-3 min-h-11"
            disabled={
              interventions.isLoading ||
              interventions.isError ||
              !interventions.data?.some((item) => item.kind === 'exercise')
            }
            onClick={generateHomeExercisePlan}
          >
            {interventions.isLoading ? 'Cargando ejercicios…' : 'Generar pauta PDF'}
          </button>
          {reportError && <p role="alert" className="mt-2 text-sm text-red-700">{reportError}</p>}
          {reportReady && (
            <p role="status" className="mt-2 text-sm text-emerald-700">
              Se abrió la pauta para imprimir o guardar como PDF.
            </p>
          )}
        </section>
      </div>
    </details>
  );
}

function InterventionList({ query }) {
  if (query.isLoading) return <p className="text-sm text-slate-500">Cargando intervenciones…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-700">No se pudieron cargar las intervenciones: {query.error.message}</p>;
  if (query.data.length === 0) return <p className="text-sm text-slate-500">Aún no hay intervenciones registradas.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {query.data.map((item) => (
        <li key={item.id} className="space-y-1 p-3 text-sm">
          <p className="font-medium text-slate-800">
            {item.kind === 'exercise' ? 'Ejercicio' : 'Agente físico'}: {item.name}
          </p>
          {item.kind === 'exercise' ? (
            <p className="text-slate-600">
              {item.contraction ? `${CONTRACTION_LABELS[item.contraction]} · ` : ''}
              {item.sets ? `${item.sets} series · ` : ''}
              {item.repetitions ? `${item.repetitions} repeticiones · ` : ''}
              {item.durationSeconds ? `${item.durationSeconds} seg · ` : ''}
              {item.restSeconds != null ? `${item.restSeconds} seg pausa · ` : ''}
              {item.frequencyPerWeek ? `${item.frequencyPerWeek} veces/semana` : ''}
            </p>
          ) : (
            <p className="text-slate-600">
              {item.technicalFrequencyHz ? `${item.technicalFrequencyHz} Hz · ` : ''}
              {item.intensity ? `${item.intensity} ${item.intensityUnit ?? ''} · ` : ''}
              {item.applicationMinutes ? `${item.applicationMinutes} min · ` : ''}
              {item.mode ?? ''}
            </p>
          )}
          {item.instructions && <p className="whitespace-pre-wrap text-slate-600">{item.instructions}</p>}
        </li>
      ))}
    </ul>
  );
}

function MeasurementList({ query }) {
  if (query.isLoading) return <p className="text-sm text-slate-500">Cargando mediciones…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-700">No se pudieron cargar las mediciones: {query.error.message}</p>;
  if (query.data.length === 0) return <p className="text-sm text-slate-500">Aún no hay mediciones registradas.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {query.data.map((measurement) => (
        <li key={measurement.id} className="p-3 text-sm">
          <p className="font-medium text-slate-800">
            {measurement.joint} · {measurement.movement}
            {measurement.side ? ` (${measurement.side})` : ''}
          </p>
          <p className="text-slate-600">
            {measurement.degrees}°
            {measurement.referenceMinDegrees != null || measurement.referenceMaxDegrees != null
              ? ` · Referencia: ${measurement.referenceMinDegrees ?? '—'}–${measurement.referenceMaxDegrees ?? '—'}°`
              : ''}
          </p>
          {measurement.notes && <p className="whitespace-pre-wrap text-slate-600">{measurement.notes}</p>}
          <time className="text-xs text-slate-400" dateTime={measurement.createdAt}>
            {new Date(measurement.createdAt).toLocaleString('es-VE')}
          </time>
        </li>
      ))}
    </ul>
  );
}

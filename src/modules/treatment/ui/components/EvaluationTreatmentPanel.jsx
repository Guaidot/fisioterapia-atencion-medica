import { useEffect, useState } from 'react';
import { useEvaluationTreatment } from '../hooks/useTreatment.js';
import { useContainer } from '../../../../app/container.jsx';
import { SelectField } from '../../../../shared/ui/components/Fields.jsx';
import {
  EXERCISE_ILLUSTRATIONS,
  getExerciseIllustration,
} from '../../exerciseIllustrations.js';
import { useTreatmentCatalog } from '../hooks/useTreatmentCatalog.js';
import { Pagination } from '../../../../shared/ui/components/Pagination.jsx';
import { usePagination } from '../../../../shared/ui/hooks/usePagination.js';
import { ExerciseIllustrationGallery } from './ExerciseIllustrationGallery.jsx';
import { RomMovementImage } from './RomMovementImage.jsx';
import { useConfirmHomeExercisePlanReview } from '../../../reports/ui/hooks/useHomeExercisePlanReview.js';
import { ROM_MOVEMENTS, romMovementLabel } from '../../romMovements.js';
import {
  ROM_MEASUREMENT_CONTEXTS,
  ROM_MEASUREMENT_CONTEXT_LABELS,
} from '../../domain/entities/RomMeasurement.js';

const EMPTY_INTERVENTION = {
  kind: 'exercise',
  catalogItemId: '',
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
  illustrationKey: '',
};

const EMPTY_MEASUREMENT = {
  movementKey: '',
  joint: '',
  movement: '',
  measurementContext: '',
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
    catalogItemId: form.catalogItemId || null,
    name: form.name,
    instructions: form.instructions,
    illustrationKey: form.illustrationKey || null,
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
    measurementContext: form.measurementContext,
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

function TextInput({
  label,
  value,
  onChange,
  required = false,
  maxLength = 200,
  readOnly = false,
}) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="label">{label}</span>
      <input
        className="input min-h-11"
        value={value}
        required={required}
        maxLength={maxLength}
        readOnly={readOnly}
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
  const [reviewError, setReviewError] = useState('');
  const [reportReady, setReportReady] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const container = useContainer();
  const reportUseCases = container.getReportUseCases();
  const reportUseCase = reportUseCases.generateHomeExercisePlan;
  const confirmReview = useConfirmHomeExercisePlanReview(patient.id);
  const selectedIllustration = getExerciseIllustration(interventionForm.illustrationKey);
  const catalogQuery = useTreatmentCatalog({ kind: interventionForm.kind });
  const selectedCatalogItem = catalogQuery.data?.find(
    (item) => item.id === interventionForm.catalogItemId,
  );
  const configuredAgentFields = selectedCatalogItem?.parameterConfig.fields ?? null;
  const {
    interventions,
    measurements,
    createIntervention,
    createMeasurement,
  } = useEvaluationTreatment(clinicalEvaluationId);
  useEffect(() => {
    setReportReady(false);
    setReviewConfirmed(false);
  }, [interventions.data]);

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
      setReviewConfirmed(false);
    } catch (error) {
      setReportError(error.message || 'No se pudo generar la pauta.');
    }
  }

  async function submitReviewConfirmation() {
    setReviewError('');
    try {
      await confirmReview.mutateAsync(clinicalEvaluationId);
    } catch (error) {
      setReviewError(error.message || 'No se pudo guardar la confirmación de revisión.');
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
              <SelectField
                label="Tipo"
                value={interventionForm.kind}
                onChange={(event) =>
                  setInterventionForm({
                    ...EMPTY_INTERVENTION,
                    kind: event.target.value,
                  })
                }
                options={[
                  { value: 'exercise', label: 'Ejercicio terapéutico' },
                  { value: 'physical_agent', label: 'Agente físico' },
                ]}
              />
              <div>
                <SelectField
                  label="Seleccionar del catálogo (opcional)"
                  value={interventionForm.catalogItemId}
                  onChange={(event) => {
                    const item = catalogQuery.data?.find((entry) => entry.id === event.target.value);
                    setInterventionForm({
                      ...interventionForm,
                      catalogItemId: item?.id ?? '',
                      name: item?.name ?? '',
                      illustrationKey: item?.illustrationKey ?? '',
                      intensityUnit: '',
                    });
                  }}
                  options={[
                    { value: '', label: 'Registro manual' },
                    ...(catalogQuery.data ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    })),
                  ]}
                />
                {catalogQuery.isError && (
                  <span role="alert" className="mt-1 block text-xs text-red-700">
                    No se pudo cargar el catálogo: {catalogQuery.error.message}. Puedes continuar con registro manual.
                  </span>
                )}
              </div>
              <TextInput
                label={interventionForm.kind === 'exercise' ? 'Ejercicio' : 'Equipo o agente'}
                required
                value={interventionForm.name}
                readOnly={Boolean(selectedCatalogItem)}
                onChange={(event) =>
                  setInterventionForm({ ...interventionForm, name: event.target.value })
                }
              />
            </div>

            {interventionForm.kind === 'exercise' ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block text-sm text-slate-700 sm:col-span-2 lg:col-span-3">
                    <span className="label">Ilustración para la pauta (opcional)</span>
                    <SelectField
                      value={interventionForm.illustrationKey}
                      disabled={Boolean(selectedCatalogItem)}
                      onChange={(event) =>
                        setInterventionForm({
                          ...interventionForm,
                          illustrationKey: event.target.value,
                        })
                      }
                      options={[
                        { value: '', label: 'Sin ilustración' },
                        ...EXERCISE_ILLUSTRATIONS.map((illustration) => ({
                          value: illustration.key,
                          label: illustration.label,
                        })),
                      ]}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Elige solo una ilustración que corresponda al ejercicio indicado.
                    </span>
                  </label>
                  {selectedIllustration && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <ExerciseIllustrationGallery illustration={selectedIllustration} />
                      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-slate-700">Posición inicial</p>
                          <p className="text-slate-600">{selectedIllustration.startingPosition}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Ejecución</p>
                          <p className="text-slate-600">{selectedIllustration.execution}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Músculos principales</p>
                          <p className="text-slate-600">{selectedIllustration.muscles}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Recomendación</p>
                          <p className="text-slate-600">{selectedIllustration.tip}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <SelectField
                    label="Tipo de contracción"
                    value={interventionForm.contraction}
                    onChange={(event) =>
                      setInterventionForm({
                        ...interventionForm,
                        contraction: event.target.value,
                      })
                    }
                    options={[
                      { value: '', label: 'No especificada' },
                      { value: 'isometrica', label: 'Isométrica' },
                      { value: 'concentrica', label: 'Concéntrica' },
                      { value: 'excentrica', label: 'Excéntrica' },
                    ]}
                  />
                  <NumberInput label="Series" min="1" value={interventionForm.sets} onChange={(e) => setInterventionForm({ ...interventionForm, sets: e.target.value })} />
                  <NumberInput label="Repeticiones" min="1" value={interventionForm.repetitions} onChange={(e) => setInterventionForm({ ...interventionForm, repetitions: e.target.value })} />
                  <NumberInput label="Duración (segundos)" min="1" value={interventionForm.durationSeconds} onChange={(e) => setInterventionForm({ ...interventionForm, durationSeconds: e.target.value })} />
                  <NumberInput label="Pausa (segundos)" min="0" value={interventionForm.restSeconds} onChange={(e) => setInterventionForm({ ...interventionForm, restSeconds: e.target.value })} />
                  <NumberInput label="Frecuencia (veces/semana)" min="1" value={interventionForm.frequencyPerWeek} onChange={(e) => setInterventionForm({ ...interventionForm, frequencyPerWeek: e.target.value })} />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {configuredAgentFields?.length === 0 && (
                  <p className="text-sm text-slate-600">
                    Este agente no tiene parámetros configurados. Un administrador puede habilitar campos en el catálogo.
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(!selectedCatalogItem || configuredAgentFields.includes('technicalFrequencyHz')) && (
                    <NumberInput label="Frecuencia técnica (Hz)" step="0.01" value={interventionForm.technicalFrequencyHz} onChange={(e) => setInterventionForm({ ...interventionForm, technicalFrequencyHz: e.target.value })} />
                  )}
                  {(!selectedCatalogItem || configuredAgentFields.includes('intensity')) && (
                    <NumberInput label="Intensidad" step="0.01" value={interventionForm.intensity} onChange={(e) => setInterventionForm({ ...interventionForm, intensity: e.target.value })} />
                  )}
                  {(!selectedCatalogItem || configuredAgentFields.includes('intensity')) && (
                    <SelectField
                      label="Unidad de intensidad"
                      value={interventionForm.intensityUnit}
                      onChange={(event) => setInterventionForm({ ...interventionForm, intensityUnit: event.target.value })}
                      options={[
                        { value: '', label: 'No indicada' },
                        ...(selectedCatalogItem?.parameterConfig.intensityUnits ?? ['mA', 'W', 'W/cm2']).map((unit) => ({
                          value: unit,
                          label: unit === 'W/cm2' ? 'W/cm²' : unit,
                        })),
                      ]}
                    />
                  )}
                  {(!selectedCatalogItem || configuredAgentFields.includes('applicationMinutes')) && (
                    <NumberInput label="Aplicación (minutos)" min="1" value={interventionForm.applicationMinutes} onChange={(e) => setInterventionForm({ ...interventionForm, applicationMinutes: e.target.value })} />
                  )}
                  {(!selectedCatalogItem || configuredAgentFields.includes('mode')) && (
                    <SelectField
                      label="Modo"
                      value={interventionForm.mode}
                      onChange={(event) => setInterventionForm({ ...interventionForm, mode: event.target.value })}
                      options={[
                        { value: '', label: 'No indicado' },
                        { value: 'continuo', label: 'Continuo' },
                        { value: 'pulsado', label: 'Pulsado' },
                      ]}
                    />
                  )}
                </div>
                {selectedCatalogItem && configuredAgentFields?.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Los parámetros habilitados son opcionales y no implican una dosis recomendada.
                  </p>
                )}
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
              <label className="block text-sm text-slate-700">
                <span className="label">Articulación / movimiento</span>
                <SelectField
                  required
                  value={measurementForm.movementKey}
                  onChange={(event) => {
                    const value = event.target.value;
                    const selected = value === '' ? null : ROM_MOVEMENTS[Number(value)];
                    setMeasurementForm({
                      ...measurementForm,
                      movementKey: value,
                      joint: selected?.joint ?? '',
                      movement: selected?.movement ?? '',
                    });
                  }}
                  options={[
                    { value: '', label: 'Selecciona un movimiento', disabled: true },
                    ...ROM_MOVEMENTS.map((item, index) => ({
                      value: String(index),
                      label: romMovementLabel(item),
                    })),
                    { value: 'other', label: 'Otro (especificar)' },
                  ]}
                />
              </label>
              <RomMovementImage
                joint={measurementForm.joint}
                movement={measurementForm.movement}
              />
              {measurementForm.movementKey === 'other' && (
                <>
                  <TextInput
                    label="Articulación"
                    maxLength={100}
                    required
                    value={measurementForm.joint}
                    onChange={(event) =>
                      setMeasurementForm({ ...measurementForm, joint: event.target.value })
                    }
                  />
                  <TextInput
                    label="Movimiento"
                    maxLength={100}
                    required
                    value={measurementForm.movement}
                    onChange={(event) =>
                      setMeasurementForm({ ...measurementForm, movement: event.target.value })
                    }
                  />
                </>
              )}
              <label className="block text-sm text-slate-700">
                <span className="label">Contexto de medición</span>
                <SelectField
                  required
                  value={measurementForm.measurementContext}
                  onChange={(event) =>
                    setMeasurementForm({
                      ...measurementForm,
                      measurementContext: event.target.value,
                    })
                  }
                  options={[
                    { value: '', label: 'Selecciona el contexto', disabled: true },
                    ...Object.values(ROM_MEASUREMENT_CONTEXTS).map((context) => ({
                      value: context,
                      label: ROM_MEASUREMENT_CONTEXT_LABELS[context],
                    })),
                  ]}
                />
              </label>
              <label className="block text-sm text-slate-700">
                <span className="label">Lado</span>
                <SelectField
                  value={measurementForm.side}
                  onChange={(event) => setMeasurementForm({ ...measurementForm, side: event.target.value })}
                  options={[
                    { value: '', label: 'No especificado' },
                    { value: 'izquierdo', label: 'Izquierdo' },
                    { value: 'derecho', label: 'Derecho' },
                    { value: 'bilateral', label: 'Bilateral' },
                  ]}
                />
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
              {createMeasurement.isPending ? 'Guardando…' : 'Agregar rango de movimiento'}
            </button>
          </form>
          <MeasurementList query={measurements} />
        </section>

        <section className="border-t border-slate-200 pt-5">
          <h3 className="font-semibold text-slate-800">Pauta domiciliaria</h3>
          <p className="mt-1 text-sm text-slate-500">
            La pauta incluye los ejercicios terapéuticos guardados. Necesitas al menos uno para
            generarla; los agentes físicos y las mediciones no se incluyen en esta pauta.
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
          {!interventions.isLoading &&
            !interventions.isError &&
            !interventions.data?.some((item) => item.kind === 'exercise') && (
              <p className="mt-2 text-sm text-slate-500">
                Guarda un ejercicio con series, repeticiones o duración para habilitar la pauta PDF.
              </p>
            )}
          {reportError && <p role="alert" className="mt-2 text-sm text-red-700">{reportError}</p>}
          {reportReady && (
            <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p role="status" className="text-sm text-emerald-700">
                Se abrió la pauta en otra pestaña. Allí pulsa “Imprimir o guardar como PDF” y
                selecciona “Guardar como PDF” en el diálogo del navegador.
              </p>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={reviewConfirmed}
                  onChange={(event) => setReviewConfirmed(event.target.checked)}
                />
                Revisé la pauta generada y confirmo que corresponde a los ejercicios indicados.
              </label>
              <button
                type="button"
                className="btn-primary min-h-11"
                disabled={!reviewConfirmed || confirmReview.isPending}
                onClick={submitReviewConfirmation}
              >
                {confirmReview.isPending ? 'Guardando revisión…' : 'Confirmar revisión profesional'}
              </button>
            </div>
          )}
          {reviewError && <p role="alert" className="mt-2 text-sm text-red-700">{reviewError}</p>}
          {evaluation.homeExercisePlanReviewedAt && (
            <p role="status" className="mt-2 text-sm text-emerald-700">
              Revisión profesional confirmada el{' '}
              {new Date(evaluation.homeExercisePlanReviewedAt).toLocaleString('es-VE', {
                timeZone: 'America/Caracas',
              })}
            </p>
          )}
        </section>
      </div>
    </details>
  );
}

function InterventionList({ query }) {
  const items = query.data ?? [];
  const pagination = usePagination(items);
  if (query.isLoading) return <p className="text-sm text-slate-500">Cargando intervenciones…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-700">No se pudieron cargar las intervenciones: {query.error.message}</p>;
  if (items.length === 0) return <p className="text-sm text-slate-500">Aún no hay intervenciones registradas.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <ul className="divide-y divide-slate-100">
        {pagination.visibleItems.map((item) => (
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
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={items.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

function MeasurementList({ query }) {
  const items = query.data ?? [];
  const pagination = usePagination(items);
  if (query.isLoading) return <p className="text-sm text-slate-500">Cargando mediciones…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-700">No se pudieron cargar las mediciones: {query.error.message}</p>;
  if (items.length === 0) return <p className="text-sm text-slate-500">Aún no hay mediciones registradas.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <ul className="divide-y divide-slate-100">
        {pagination.visibleItems.map((measurement) => (
          <li key={measurement.id} className="p-3 text-sm">
            <p className="font-medium text-slate-800">
              {measurement.joint} · {measurement.movement}
              {measurement.side ? ` (${measurement.side})` : ''}
            </p>
            <p className="text-slate-600">
              {measurement.measurementContext
                ? `${ROM_MEASUREMENT_CONTEXT_LABELS[measurement.measurementContext]} · `
                : ''}
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
      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={items.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />
    </div>
  );
}

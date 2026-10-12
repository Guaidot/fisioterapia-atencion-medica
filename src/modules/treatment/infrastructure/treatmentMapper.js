import { TreatmentIntervention } from '../domain/entities/TreatmentIntervention.js';
import { RomMeasurement } from '../domain/entities/RomMeasurement.js';

export function rowToIntervention(row) {
  return new TreatmentIntervention({
    id: row.id,
    clinicalEvaluationId: row.clinical_evaluation_id,
    kind: row.kind,
    name: row.name,
    contraction: row.contraction,
    sets: row.sets,
    repetitions: row.repetitions,
    durationSeconds: row.duration_seconds,
    restSeconds: row.rest_seconds,
    frequencyPerWeek: row.frequency_per_week,
    technicalFrequencyHz: row.technical_frequency_hz == null
      ? null
      : Number(row.technical_frequency_hz),
    intensity: row.intensity == null ? null : Number(row.intensity),
    intensityUnit: row.intensity_unit,
    applicationMinutes: row.application_minutes,
    mode: row.mode,
    instructions: row.instructions,
    illustrationKey: row.illustration_key,
    createdBy: row.created_by,
    createdAt: row.created_at,
  });
}

export function interventionToRow(intervention) {
  const item = intervention.toPrimitives();
  return {
    clinical_evaluation_id: item.clinicalEvaluationId,
    kind: item.kind,
    name: item.name,
    contraction: item.contraction,
    sets: item.sets,
    repetitions: item.repetitions,
    duration_seconds: item.durationSeconds,
    rest_seconds: item.restSeconds,
    frequency_per_week: item.frequencyPerWeek,
    technical_frequency_hz: item.technicalFrequencyHz,
    intensity: item.intensity,
    intensity_unit: item.intensityUnit,
    application_minutes: item.applicationMinutes,
    mode: item.mode,
    instructions: item.instructions,
    illustration_key: item.illustrationKey,
  };
}

export function rowToRomMeasurement(row) {
  return new RomMeasurement({
    id: row.id,
    clinicalEvaluationId: row.clinical_evaluation_id,
    joint: row.joint,
    movement: row.movement,
    side: row.side,
    degrees: Number(row.degrees),
    referenceMinDegrees: row.reference_min_degrees == null
      ? null
      : Number(row.reference_min_degrees),
    referenceMaxDegrees: row.reference_max_degrees == null
      ? null
      : Number(row.reference_max_degrees),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  });
}

export function romMeasurementToRow(measurement) {
  const item = measurement.toPrimitives();
  return {
    clinical_evaluation_id: item.clinicalEvaluationId,
    joint: item.joint,
    movement: item.movement,
    side: item.side,
    degrees: item.degrees,
    reference_min_degrees: item.referenceMinDegrees,
    reference_max_degrees: item.referenceMaxDegrees,
    notes: item.notes,
  };
}

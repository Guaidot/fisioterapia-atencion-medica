import { ClinicalHistory } from '../domain/entities/ClinicalHistory.js';

export function rowToClinicalHistory(row) {
  return new ClinicalHistory({
    id: row.id,
    patientId: row.patient_id,
    diagnosis: row.diagnosis,
    lesionType: row.lesion_type,
    zone: row.zone,
    phase: row.phase,
    evaScore: row.eva_score,
    therapistId: row.created_by,
    createdAt: row.created_at,
    clinicalObservations: row.clinical_observations ?? '',
    appointmentId: row.appointment_id ?? null,
    homeExercisePlanReviewedAt: row.home_exercise_plan_reviewed_at ?? null,
    homeExercisePlanReviewedBy: row.home_exercise_plan_reviewed_by ?? null,
    vitalsMeasuredAt: row.vitals_measured_at ?? null,
    bloodPressureSystolic: row.blood_pressure_systolic,
    bloodPressureDiastolic: row.blood_pressure_diastolic,
    oxygenSaturation: row.oxygen_saturation,
    temperatureCelsius: row.temperature_celsius,
    heartRate: row.heart_rate,
    sleepHours: row.sleep_hours,
    sleepQuality: row.sleep_quality,
    bloodPressureMedications: row.blood_pressure_medications ?? [],
    otherBloodPressureMedication: row.other_blood_pressure_medication,
    otherMedication: row.other_medication,
  });
}

export function clinicalHistoryToRow(history, therapistId) {
  const h = history.toPrimitives();
  return {
    id: h.id ?? undefined,
    patient_id: h.patientId,
    diagnosis: h.diagnosis,
    lesion_type: h.lesionType,
    zone: h.zone,
    phase: h.phase,
    eva_score: h.evaScore,
    clinical_observations: h.clinicalObservations,
    appointment_id: h.appointmentId,
    vitals_measured_at: h.vitalsMeasuredAt,
    blood_pressure_systolic: h.bloodPressureSystolic,
    blood_pressure_diastolic: h.bloodPressureDiastolic,
    oxygen_saturation: h.oxygenSaturation,
    temperature_celsius: h.temperatureCelsius,
    heart_rate: h.heartRate,
    sleep_hours: h.sleepHours,
    sleep_quality: h.sleepQuality,
    blood_pressure_medications: h.bloodPressureMedications,
    other_blood_pressure_medication: h.otherBloodPressureMedication,
    other_medication: h.otherMedication,
  };
}
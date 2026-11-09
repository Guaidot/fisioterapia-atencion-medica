import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';
import { EvaScore } from '../valueObjects/EvaScore.js';

export const LESION_TYPES = [
  'articular',
  'muscular',
  'tendinosa',
  'ligamentosa',
  'neurologica',
  'osea',
];

export const ANATOMICAL_ZONES = [
  'hombro',
  'rodilla',
  'columna',
  'codo',
  'tobillo',
  'cadera',
  'muneca',
  'cuello',
];

export const EVOLUTION_PHASES = ['aguda', 'subaguda', 'cronica'];
export const VITAL_SIGN_FIELDS = [
  'bloodPressureSystolic',
  'bloodPressureDiastolic',
  'oxygenSaturation',
  'temperatureCelsius',
  'heartRate',
];

export class ClinicalHistory extends Entity {
  constructor({
    id = null,
    patientId,
    diagnosis,
    lesionType,
    zone,
    phase,
    evaScore = null,
    therapistId = null,
    createdAt = null,
    clinicalObservations = '',
    appointmentId = null,
    homeExercisePlanReviewedAt = null,
    homeExercisePlanReviewedBy = null,
    vitalsMeasuredAt = null,
    bloodPressureSystolic = null,
    bloodPressureDiastolic = null,
    oxygenSaturation = null,
    temperatureCelsius = null,
    heartRate = null,
    sleepHours = null,
    sleepQuality = null,
    bloodPressureMedications = [],
    otherBloodPressureMedication = '',
    otherMedication = '',
  }) {
    super(id);
    this.assertRequired(patientId, 'Paciente');
    this.assertRequired(diagnosis, 'Diagnóstico');
    this.patientId = patientId;
    this.diagnosis = diagnosis.trim();
    this.lesionType = this.assertOneOf(lesionType, LESION_TYPES, 'Tipo de lesión');
    this.zone = this.assertOneOf(zone, ANATOMICAL_ZONES, 'Zona anatómica');
    this.phase = this.assertOneOf(phase, EVOLUTION_PHASES, 'Fase de evolución');
    this.evaScore = evaScore == null ? null : new EvaScore(evaScore);
    this.therapistId = therapistId;
    this.createdAt = createdAt;
    if (typeof clinicalObservations !== 'string' || clinicalObservations.length > 2000) {
      throw new DomainError('Las observaciones clínicas deben ser texto y no superar 2000 caracteres.');
    }
    this.clinicalObservations = clinicalObservations.trim();
    this.appointmentId = appointmentId;
    this.homeExercisePlanReviewedAt = homeExercisePlanReviewedAt;
    this.homeExercisePlanReviewedBy = homeExercisePlanReviewedBy;
    if (
      vitalsMeasuredAt != null &&
      (typeof vitalsMeasuredAt !== 'string' || !Number.isFinite(Date.parse(vitalsMeasuredAt)))
    ) {
      throw new DomainError('La fecha y hora de medición de signos vitales no es válida.');
    }
    this.vitalsMeasuredAt = vitalsMeasuredAt;
    this.assertBloodPressurePair(bloodPressureSystolic, bloodPressureDiastolic);
    this.bloodPressureSystolic = bloodPressureSystolic;
    this.bloodPressureDiastolic = bloodPressureDiastolic;
    this.oxygenSaturation = oxygenSaturation;
    this.temperatureCelsius = temperatureCelsius;
    this.heartRate = heartRate;
    if (
      oxygenSaturation != null &&
      (!Number.isFinite(oxygenSaturation) || oxygenSaturation < 0 || oxygenSaturation > 100)
    ) {
      throw new DomainError('La saturación de oxígeno debe estar entre 0 y 100.');
    }
    if (
      temperatureCelsius != null &&
      (!Number.isFinite(temperatureCelsius) || temperatureCelsius <= 0 || temperatureCelsius > 99.99)
    ) {
      throw new DomainError('La temperatura debe ser mayor que cero y no superar 99.99 °C.');
    }
    if (heartRate != null && (!Number.isInteger(heartRate) || heartRate <= 0)) {
      throw new DomainError('La frecuencia cardíaca debe ser un entero positivo.');
    }
    if (
      id == null &&
      VITAL_SIGN_FIELDS.some((field) => this[field] != null) &&
      this.vitalsMeasuredAt == null
    ) {
      throw new DomainError('Registra la fecha y hora de medición de los signos vitales.');
    }
    this.sleepHours = sleepHours;
    this.sleepQuality = sleepQuality;
    this.bloodPressureMedications = bloodPressureMedications ?? [];
    this.otherBloodPressureMedication = otherBloodPressureMedication ?? '';
    this.otherMedication = otherMedication ?? '';
  }

  assertRequired(value, field) {
    if (!value) {
      throw new DomainError(`${field} es obligatorio.`);
    }
  }

  assertOneOf(value, allowed, field) {
    if (!allowed.includes(value)) {
      throw new DomainError(`${field} inválido. Permitidos: ${allowed.join(', ')}.`);
    }
    return value;
  }

  assertBloodPressurePair(systolic, diastolic) {
    if ((systolic == null) !== (diastolic == null)) {
      throw new DomainError('Ingresa ambos valores de la tensión arterial.');
    }

    for (const [value, field] of [
      [systolic, 'Presión sistólica'],
      [diastolic, 'Presión diastólica'],
    ]) {
      if (value != null && (!Number.isInteger(value) || value <= 0)) {
        throw new DomainError(`${field} debe ser un entero positivo.`);
      }
    }
  }

  toPrimitives() {
    return {
      id: this.id,
      patientId: this.patientId,
      diagnosis: this.diagnosis,
      lesionType: this.lesionType,
      zone: this.zone,
      phase: this.phase,
      evaScore: this.evaScore?.value ?? null,
      evaLevel: this.evaScore?.level ?? null,
      therapistId: this.therapistId,
      createdAt: this.createdAt,
      clinicalObservations: this.clinicalObservations,
      appointmentId: this.appointmentId,
      homeExercisePlanReviewedAt: this.homeExercisePlanReviewedAt,
      homeExercisePlanReviewedBy: this.homeExercisePlanReviewedBy,
      vitalsMeasuredAt: this.vitalsMeasuredAt,
      bloodPressureSystolic: this.bloodPressureSystolic,
      bloodPressureDiastolic: this.bloodPressureDiastolic,
      oxygenSaturation: this.oxygenSaturation,
      temperatureCelsius: this.temperatureCelsius,
      heartRate: this.heartRate,
      sleepHours: this.sleepHours,
      sleepQuality: this.sleepQuality,
      bloodPressureMedications: this.bloodPressureMedications,
      otherBloodPressureMedication: this.otherBloodPressureMedication,
      otherMedication: this.otherMedication,
    };
  }
}
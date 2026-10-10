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

export class ClinicalHistory extends Entity {
  constructor({
    id = null,
    patientId,
    diagnosis,
    lesionType,
    zone,
    phase,
    evaScore = 0,
    therapistId = null,
    createdAt = null,
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
    this.evaScore = new EvaScore(evaScore);
    this.therapistId = therapistId;
    this.createdAt = createdAt;
    this.assertBloodPressurePair(bloodPressureSystolic, bloodPressureDiastolic);
    this.bloodPressureSystolic = bloodPressureSystolic;
    this.bloodPressureDiastolic = bloodPressureDiastolic;
    this.oxygenSaturation = oxygenSaturation;
    this.temperatureCelsius = temperatureCelsius;
    this.heartRate = heartRate;
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
      evaScore: this.evaScore.value,
      evaLevel: this.evaScore.level,
      therapistId: this.therapistId,
      createdAt: this.createdAt,
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
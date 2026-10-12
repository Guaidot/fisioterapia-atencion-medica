import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';
import { getExerciseIllustration } from '../../exerciseIllustrations.js';

const KINDS = ['exercise', 'physical_agent'];
const CONTRACTIONS = ['isometrica', 'concentrica', 'excentrica'];
const MODES = ['continuo', 'pulsado'];
const INTENSITY_UNITS = ['mA', 'W', 'W/cm2'];

export class TreatmentIntervention extends Entity {
  constructor({
    id = null,
    clinicalEvaluationId,
    kind,
    name,
    contraction = null,
    sets = null,
    repetitions = null,
    durationSeconds = null,
    restSeconds = null,
    frequencyPerWeek = null,
    technicalFrequencyHz = null,
    intensity = null,
    intensityUnit = null,
    applicationMinutes = null,
    mode = null,
    instructions = '',
    illustrationKey = null,
    createdBy = null,
    createdAt = null,
  }) {
    super(id);
    this.assertRequired(clinicalEvaluationId, 'Evaluación clínica');
    this.assertRequired(name?.trim(), 'Nombre del tratamiento');
    if (!KINDS.includes(kind)) throw new DomainError('Tipo de tratamiento inválido.');

    this.clinicalEvaluationId = clinicalEvaluationId;
    this.kind = kind;
    this.name = name.trim();
    this.instructions = instructions?.trim() ?? '';
    if (illustrationKey != null && !getExerciseIllustration(illustrationKey)) {
      throw new DomainError('La ilustración seleccionada no es válida.');
    }
    this.createdBy = createdBy;
    this.createdAt = createdAt;

    if (kind === 'exercise') {
      this.assertOptionalPositiveInteger(sets, 'Las series');
      this.assertOptionalPositiveInteger(repetitions, 'Las repeticiones');
      this.assertOptionalPositiveInteger(durationSeconds, 'La duración');
      this.assertOptionalNonNegativeInteger(restSeconds, 'La pausa');
      this.assertOptionalPositiveInteger(frequencyPerWeek, 'La frecuencia semanal');
      if (sets == null && repetitions == null && durationSeconds == null) {
        throw new DomainError(
          'Indica al menos series, repeticiones o duración para el ejercicio.',
        );
      }
      if (contraction != null && !CONTRACTIONS.includes(contraction)) {
        throw new DomainError('Tipo de contracción inválido.');
      }
      this.contraction = contraction;
      this.sets = sets;
      this.repetitions = repetitions;
      this.durationSeconds = durationSeconds;
      this.restSeconds = restSeconds;
      this.frequencyPerWeek = frequencyPerWeek;
      this.illustrationKey = illustrationKey;
      this.technicalFrequencyHz = null;
      this.intensity = null;
      this.intensityUnit = null;
      this.applicationMinutes = null;
      this.mode = null;
    } else {
      this.assertOptionalPositive(technicalFrequencyHz, 'La frecuencia técnica');
      this.assertOptionalPositive(intensity, 'La intensidad');
      this.assertOptionalPositiveInteger(applicationMinutes, 'El tiempo de aplicación');
      if (applicationMinutes == null) {
        throw new DomainError('El tiempo de aplicación del agente físico es obligatorio.');
      }
      if (intensityUnit != null && !INTENSITY_UNITS.includes(intensityUnit)) {
        throw new DomainError('Unidad de intensidad inválida.');
      }
      if (mode != null && !MODES.includes(mode)) throw new DomainError('Modo inválido.');
      this.contraction = null;
      this.sets = null;
      this.repetitions = null;
      this.durationSeconds = null;
      this.restSeconds = null;
      this.frequencyPerWeek = null;
      this.technicalFrequencyHz = technicalFrequencyHz;
      this.intensity = intensity;
      this.intensityUnit = intensityUnit;
      this.applicationMinutes = applicationMinutes;
      this.mode = mode;
      this.illustrationKey = null;
    }
  }

  assertRequired(value, field) {
    if (!value) throw new DomainError(`${field} es obligatorio.`);
  }

  assertOptionalPositiveInteger(value, field) {
    if (value != null && (!Number.isInteger(value) || value <= 0)) {
      throw new DomainError(`${field} debe ser un entero positivo.`);
    }
  }

  assertOptionalNonNegativeInteger(value, field) {
    if (value != null && (!Number.isInteger(value) || value < 0)) {
      throw new DomainError(`${field} debe ser un entero no negativo.`);
    }
  }

  assertOptionalPositive(value, field) {
    if (value != null && (!Number.isFinite(value) || value <= 0)) {
      throw new DomainError(`${field} debe ser mayor que cero.`);
    }
  }

  toPrimitives() {
    return {
      id: this.id,
      clinicalEvaluationId: this.clinicalEvaluationId,
      kind: this.kind,
      name: this.name,
      contraction: this.contraction,
      sets: this.sets,
      repetitions: this.repetitions,
      durationSeconds: this.durationSeconds,
      restSeconds: this.restSeconds,
      frequencyPerWeek: this.frequencyPerWeek,
      technicalFrequencyHz: this.technicalFrequencyHz,
      intensity: this.intensity,
      intensityUnit: this.intensityUnit,
      applicationMinutes: this.applicationMinutes,
      mode: this.mode,
      instructions: this.instructions,
      illustrationKey: this.illustrationKey,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
    };
  }
}

import { ClinicalHistoryRepository } from '../../domain/ports/ClinicalHistoryRepository.js';
import {
  ClinicalHistory,
  VITAL_SIGN_FIELDS,
} from '../../domain/entities/ClinicalHistory.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

export class UpdateClinicalHistoryUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof ClinicalHistoryRepository)) {
      throw new TypeError('UpdateClinicalHistoryUseCase requiere un ClinicalHistoryRepository.');
    }
    this.#repository = repository;
  }

  async execute({ id, ...input }) {
    if (!id) throw new DomainError('La evaluación que intentas editar no es válida.');

    const existing = await this.#repository.findById(id);
    if (!existing) throw new DomainError('No se encontró la evaluación que intentas editar.');

    if (input.patientId !== existing.patientId) {
      throw new DomainError('No se puede cambiar el paciente de una evaluación existente.');
    }

    const vitalsChanged = VITAL_SIGN_FIELDS.some(
      (field) => (input[field] ?? null) !== (existing[field] ?? null),
    );
    const hasVitals = VITAL_SIGN_FIELDS.some((field) => input[field] != null);
    const vitalsMeasuredAt = Object.prototype.hasOwnProperty.call(input, 'vitalsMeasuredAt')
      ? input.vitalsMeasuredAt
      : existing.vitalsMeasuredAt;
    if (hasVitals && !vitalsMeasuredAt && vitalsChanged) {
      throw new DomainError('Registra la fecha y hora de medición de los signos vitales.');
    }

    const history = new ClinicalHistory({
      ...input,
      id,
      appointmentId: existing.appointmentId,
      homeExercisePlanReviewedAt: existing.homeExercisePlanReviewedAt,
      homeExercisePlanReviewedBy: existing.homeExercisePlanReviewedBy,
      vitalsMeasuredAt,
      therapistId: existing.therapistId,
      createdAt: existing.createdAt,
    });
    const saved = await this.#repository.save(history);
    return saved.toPrimitives();
  }
}

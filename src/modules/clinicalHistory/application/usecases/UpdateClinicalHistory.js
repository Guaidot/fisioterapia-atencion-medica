import { ClinicalHistoryRepository } from '../../domain/ports/ClinicalHistoryRepository.js';
import { ClinicalHistory } from '../../domain/entities/ClinicalHistory.js';
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

    const history = new ClinicalHistory({
      ...input,
      id,
      therapistId: existing.therapistId,
      createdAt: existing.createdAt,
    });
    const saved = await this.#repository.save(history);
    return saved.toPrimitives();
  }
}

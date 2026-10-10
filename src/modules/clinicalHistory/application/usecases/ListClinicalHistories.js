import { ClinicalHistoryRepository } from '../../domain/ports/ClinicalHistoryRepository.js';

export class ListClinicalHistoriesUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof ClinicalHistoryRepository)) {
      throw new TypeError('ListClinicalHistoriesUseCase requiere un ClinicalHistoryRepository.');
    }
    this.#repository = repository;
  }

  async execute({ patientId } = {}) {
    const histories = patientId
      ? await this.#repository.findByPatient(patientId)
      : await this.#repository.findAll();
    return histories.map((h) => h.toPrimitives());
  }
}
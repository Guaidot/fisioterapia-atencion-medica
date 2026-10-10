import { ClinicalHistoryRepository } from '../../domain/ports/ClinicalHistoryRepository.js';
import { ClinicalHistory } from '../../domain/entities/ClinicalHistory.js';

export class CreateClinicalHistoryUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof ClinicalHistoryRepository)) {
      throw new TypeError('CreateClinicalHistoryUseCase requiere un ClinicalHistoryRepository.');
    }
    this.#repository = repository;
  }

  async execute(input) {
    const history = new ClinicalHistory(input);
    const saved = await this.#repository.save(history);
    return saved.toPrimitives();
  }
}
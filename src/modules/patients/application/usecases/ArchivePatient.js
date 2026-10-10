import { PatientRepository } from '../../domain/ports/PatientRepository.js';

export class ArchivePatientUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('ArchivePatientUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(id) {
    await this.#repository.archive(id);
  }
}

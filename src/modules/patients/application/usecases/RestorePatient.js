import { PatientRepository } from '../../domain/ports/PatientRepository.js';

export class RestorePatientUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('RestorePatientUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(id) {
    await this.#repository.restore(id);
  }
}

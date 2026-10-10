import { PatientRepository } from '../../domain/ports/PatientRepository.js';

export class ListPatientsUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('ListPatientsUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(options) {
    const patients = await this.#repository.findAll(options);
    return patients.map((p) => p.toPrimitives());
  }
}
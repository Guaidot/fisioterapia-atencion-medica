import { PatientRepository } from '../../domain/ports/PatientRepository.js';

export class CheckPatientCedulaUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('CheckPatientCedulaUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(cedula) {
    return this.#repository.existsByCedula(cedula);
  }
}

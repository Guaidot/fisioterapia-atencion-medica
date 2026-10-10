import { PatientRepository } from '../../domain/ports/PatientRepository.js';

export class FindPatientByCedulaUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('FindPatientByCedulaUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(cedula) {
    const patient = await this.#repository.findByCedula(cedula);
    return patient?.toPrimitives() ?? null;
  }
}

import { PatientRepository } from '../../domain/ports/PatientRepository.js';
import { Patient } from '../../domain/entities/Patient.js';

export class CreatePatientUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('CreatePatientUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(input) {
    const patient = new Patient(input);
    const saved = await this.#repository.save(patient);
    return saved.toPrimitives();
  }
}
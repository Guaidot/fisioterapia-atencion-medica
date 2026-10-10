import { PatientRepository } from '../../domain/ports/PatientRepository.js';
import { Patient } from '../../domain/entities/Patient.js';

export class UpdatePatientUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof PatientRepository)) {
      throw new TypeError('UpdatePatientUseCase requiere un PatientRepository.');
    }
    this.#repository = repository;
  }

  async execute(id, input) {
    const existing = await this.#repository.findById(id);
    if (!existing) {
      throw new Error('Paciente no encontrado.');
    }
    const updated = await this.#repository.save(
      new Patient({ ...existing.toPrimitives(), ...input, id }),
    );
    return updated.toPrimitives();
  }
}
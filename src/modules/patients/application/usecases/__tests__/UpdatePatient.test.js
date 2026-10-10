import { describe, expect, it, vi } from 'vitest';
import { Patient } from '../../../domain/entities/Patient.js';
import { PatientRepository } from '../../../domain/ports/PatientRepository.js';
import { UpdatePatientUseCase } from '../UpdatePatient.js';

describe('UpdatePatientUseCase', () => {
  it('saves the updated patient as a Patient entity', async () => {
    const existing = new Patient({
      id: 'patient-id',
      firstName: 'Ana',
      lastName: 'Pérez',
      cedula: '12345678',
      gender: 'femenino',
    });
    const repository = new (class extends PatientRepository {
      findById = vi.fn().mockResolvedValue(existing);
      save = vi.fn(async (patient) => patient);
    })();
    const useCase = new UpdatePatientUseCase(repository);

    const result = await useCase.execute('patient-id', {
      firstName: 'María',
      lastName: 'Gómez',
    });

    expect(repository.save).toHaveBeenCalledWith(expect.any(Patient));
    expect(result).toMatchObject({
      id: 'patient-id',
      firstName: 'María',
      lastName: 'Gómez',
      fullName: 'María Gómez',
    });
  });
});

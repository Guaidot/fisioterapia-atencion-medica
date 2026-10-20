import { describe, expect, it, vi } from 'vitest';
import { ClinicalHistoryRepository } from '../../../domain/ports/ClinicalHistoryRepository.js';
import { ClinicalHistory } from '../../../domain/entities/ClinicalHistory.js';
import { UpdateClinicalHistoryUseCase } from '../UpdateClinicalHistory.js';

class InMemoryClinicalHistoryRepository extends ClinicalHistoryRepository {
  constructor(history) {
    super();
    this.history = history;
    this.save = vi.fn(async (historyToSave) => historyToSave);
  }

  async findById(id) {
    return this.history.id === id ? this.history : null;
  }
}

const existingHistory = new ClinicalHistory({
  id: 'evaluation-1',
  patientId: 'patient-1',
  diagnosis: 'Diagnóstico anterior',
  lesionType: 'muscular',
  zone: 'hombro',
  phase: 'aguda',
  evaScore: 3,
  therapistId: 'therapist-1',
  createdAt: '2026-01-01T10:00:00.000Z',
  clinicalObservations: 'Observación original',
  vitalsMeasuredAt: '2026-01-01T10:15:00.000Z',
});

const legacyHistoryWithVitals = new ClinicalHistory({
  id: 'legacy-evaluation',
  patientId: 'patient-1',
  diagnosis: 'Diagnóstico anterior',
  lesionType: 'muscular',
  zone: 'hombro',
  phase: 'aguda',
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  createdAt: '2025-01-01T10:00:00.000Z',
});

describe('UpdateClinicalHistoryUseCase', () => {
  it('actualiza la evaluación conservando paciente, autor y fecha de creación', async () => {
    const repository = new InMemoryClinicalHistoryRepository(existingHistory);
    const useCase = new UpdateClinicalHistoryUseCase(repository);

    const updated = await useCase.execute({
      id: 'evaluation-1',
      patientId: 'patient-1',
      diagnosis: 'Diagnóstico corregido',
      lesionType: 'tendinosa',
      zone: 'hombro',
      phase: 'subaguda',
      evaScore: 5,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      clinicalObservations: 'Observación corregida',
      vitalsMeasuredAt: '2026-01-01T10:15:00.000Z',
    });

    expect(updated).toMatchObject({
      id: 'evaluation-1',
      patientId: 'patient-1',
      diagnosis: 'Diagnóstico corregido',
      therapistId: 'therapist-1',
      createdAt: '2026-01-01T10:00:00.000Z',
      clinicalObservations: 'Observación corregida',
      vitalsMeasuredAt: '2026-01-01T10:15:00.000Z',
    });
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('rechaza el cambio de paciente en una evaluación existente', async () => {
    const repository = new InMemoryClinicalHistoryRepository(existingHistory);
    const useCase = new UpdateClinicalHistoryUseCase(repository);

    await expect(
      useCase.execute({
        id: 'evaluation-1',
        patientId: 'patient-2',
        diagnosis: 'Diagnóstico',
        lesionType: 'muscular',
        zone: 'hombro',
        phase: 'aguda',
        evaScore: 3,
      }),
    ).rejects.toThrow('No se puede cambiar el paciente de una evaluación existente.');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rechaza una evaluación inexistente', async () => {
    const repository = new InMemoryClinicalHistoryRepository(existingHistory);
    const useCase = new UpdateClinicalHistoryUseCase(repository);

    await expect(useCase.execute({ id: 'missing', patientId: 'patient-1' })).rejects.toThrow(
      'No se encontró la evaluación que intentas editar.',
    );
  });

  it('permite corregir otros datos antiguos si conserva los signos vitales sin hora conocida', async () => {
    const repository = new InMemoryClinicalHistoryRepository(legacyHistoryWithVitals);
    const useCase = new UpdateClinicalHistoryUseCase(repository);

    const updated = await useCase.execute({
      id: 'legacy-evaluation',
      patientId: 'patient-1',
      diagnosis: 'Diagnóstico corregido',
      lesionType: 'muscular',
      zone: 'hombro',
      phase: 'aguda',
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
    });

    expect(updated.vitalsMeasuredAt).toBeNull();
  });

  it('exige hora de medición si se modifican signos vitales de un registro antiguo', async () => {
    const repository = new InMemoryClinicalHistoryRepository(legacyHistoryWithVitals);
    const useCase = new UpdateClinicalHistoryUseCase(repository);

    await expect(
      useCase.execute({
        id: 'legacy-evaluation',
        patientId: 'patient-1',
        diagnosis: 'Diagnóstico',
        lesionType: 'muscular',
        zone: 'hombro',
        phase: 'aguda',
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 80,
      }),
    ).rejects.toThrow('Registra la fecha y hora de medición de los signos vitales.');
  });
});

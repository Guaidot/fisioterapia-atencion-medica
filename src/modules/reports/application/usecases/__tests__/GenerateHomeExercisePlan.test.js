import { describe, expect, it, vi } from 'vitest';
import { HomeExercisePlanPdfPort } from '../../../domain/ports/HomeExercisePlanPdfPort.js';
import { GenerateHomeExercisePlanUseCase } from '../GenerateHomeExercisePlan.js';

class FakePdfPort extends HomeExercisePlanPdfPort {
  constructor() {
    super();
    this.generate = vi.fn(() => true);
  }
}

const patient = { id: 'patient-1', fullName: 'Ana Paciente', cedula: '12345678' };
const evaluation = {
  id: 'evaluation-1',
  patientId: 'patient-1',
  diagnosis: 'Dolor de rodilla',
  zone: 'rodilla',
  phase: 'subaguda',
  createdAt: '2026-10-10T12:00:00.000Z',
};
const interventions = [
  { kind: 'exercise', name: 'Flexión de rodilla', sets: 3, repetitions: 10 },
  { kind: 'physical_agent', name: 'TENS', applicationMinutes: 15 },
];

describe('GenerateHomeExercisePlanUseCase', () => {
  it('includes only prescribed exercises and minimizes patient data', () => {
    const pdfPort = new FakePdfPort();
    const useCase = new GenerateHomeExercisePlanUseCase(pdfPort);

    expect(useCase.execute({ patient, evaluation, interventions })).toBe(true);
    expect(pdfPort.generate).toHaveBeenCalledWith({
      patient: { fullName: 'Ana Paciente' },
      evaluation: {
        diagnosis: 'Dolor de rodilla',
        zone: 'rodilla',
        phase: 'subaguda',
        createdAt: evaluation.createdAt,
      },
      exercises: [interventions[0]],
    });
  });

  it('requires an exercise and matching patient evaluation', () => {
    const useCase = new GenerateHomeExercisePlanUseCase(new FakePdfPort());
    expect(() =>
      useCase.execute({ patient, evaluation, interventions: [interventions[1]] }),
    ).toThrow('Agrega al menos un ejercicio antes de generar la pauta.');
    expect(() =>
      useCase.execute({
        patient,
        evaluation: { ...evaluation, patientId: 'patient-2' },
        interventions,
      }),
    ).toThrow('No se pudo validar el paciente y su evaluación clínica.');
  });
});

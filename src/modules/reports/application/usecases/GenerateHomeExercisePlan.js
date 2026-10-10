import { DomainError } from '../../../../shared/domain/DomainError.js';
import { HomeExercisePlanPdfPort } from '../../domain/ports/HomeExercisePlanPdfPort.js';

export class GenerateHomeExercisePlanUseCase {
  #pdfPort;

  constructor(pdfPort) {
    if (!(pdfPort instanceof HomeExercisePlanPdfPort)) {
      throw new TypeError('GenerateHomeExercisePlanUseCase requiere un HomeExercisePlanPdfPort.');
    }
    this.#pdfPort = pdfPort;
  }

  execute({ patient, evaluation, interventions }) {
    if (!patient?.id || !evaluation?.id || evaluation.patientId !== patient.id) {
      throw new DomainError('No se pudo validar el paciente y su evaluación clínica.');
    }

    const exercises = (interventions ?? []).filter((item) => item.kind === 'exercise');
    if (exercises.length === 0) {
      throw new DomainError('Agrega al menos un ejercicio antes de generar la pauta.');
    }

    return this.#pdfPort.generate({
      patient: { fullName: patient.fullName },
      evaluation: {
        diagnosis: evaluation.diagnosis,
        zone: evaluation.zone,
        phase: evaluation.phase,
        createdAt: evaluation.createdAt,
      },
      exercises,
    });
  }
}

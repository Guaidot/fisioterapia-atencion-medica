import { TreatmentRepository } from '../../domain/ports/TreatmentRepository.js';
import { TreatmentIntervention } from '../../domain/entities/TreatmentIntervention.js';
import { RomMeasurement } from '../../domain/entities/RomMeasurement.js';

class TreatmentUseCase {
  constructor(repository) {
    if (!(repository instanceof TreatmentRepository)) {
      throw new TypeError(`${new.target.name} requiere un TreatmentRepository.`);
    }
    this.repository = repository;
  }
}

export class ListInterventionsUseCase extends TreatmentUseCase {
  async execute({ clinicalEvaluationId }) {
    return (await this.repository.listByEvaluation(clinicalEvaluationId)).map((item) =>
      item.toPrimitives(),
    );
  }
}

export class CreateInterventionUseCase extends TreatmentUseCase {
  async execute(input) {
    const intervention = new TreatmentIntervention(input);
    return (await this.repository.saveIntervention(intervention)).toPrimitives();
  }
}

export class ListRomMeasurementsUseCase extends TreatmentUseCase {
  async execute({ clinicalEvaluationId }) {
    return (await this.repository.listMeasurementsByEvaluation(clinicalEvaluationId)).map(
      (item) => item.toPrimitives(),
    );
  }
}

export class ListRomMeasurementsByEvaluationsUseCase extends TreatmentUseCase {
  async execute({ clinicalEvaluationIds }) {
    if (!Array.isArray(clinicalEvaluationIds) || clinicalEvaluationIds.length === 0) return [];
    return (
      await this.repository.listMeasurementsByEvaluations(clinicalEvaluationIds)
    ).map((item) => item.toPrimitives());
  }
}

export class CreateRomMeasurementUseCase extends TreatmentUseCase {
  async execute(input) {
    const measurement = new RomMeasurement(input);
    return (await this.repository.saveMeasurement(measurement)).toPrimitives();
  }
}

import { TreatmentRepository } from '../../domain/ports/TreatmentRepository.js';
import { TreatmentIntervention } from '../../domain/entities/TreatmentIntervention.js';
import { RomMeasurement } from '../../domain/entities/RomMeasurement.js';
import { TreatmentCatalogRepository } from '../../domain/ports/TreatmentCatalogRepository.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

class TreatmentUseCase {
  constructor(repository, catalogRepository = null) {
    if (!(repository instanceof TreatmentRepository)) {
      throw new TypeError(`${new.target.name} requiere un TreatmentRepository.`);
    }
    if (catalogRepository != null && !(catalogRepository instanceof TreatmentCatalogRepository)) {
      throw new TypeError(`${new.target.name} requiere un TreatmentCatalogRepository.`);
    }
    this.repository = repository;
    this.catalogRepository = catalogRepository;
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
  constructor(repository, catalogRepository = null) {
    super(repository, catalogRepository);
  }

  async execute(input) {
    let interventionInput = input;
    if (input.catalogItemId) {
      if (!this.catalogRepository) {
        throw new TypeError('CreateInterventionUseCase requiere un catálogo terapéutico.');
      }
      const catalogItem = await this.catalogRepository.findById(input.catalogItemId);
      if (!catalogItem || !catalogItem.active || catalogItem.kind !== input.kind) {
        throw new DomainError(
          'El elemento del catálogo no existe, está inactivo o no corresponde al tipo.',
        );
      }
      interventionInput = {
        ...input,
        name: catalogItem.name,
        illustrationKey: catalogItem.illustrationKey,
        parameterConfig: catalogItem.parameterConfig,
      };
    }
    if (
      interventionInput.kind === 'physical_agent' &&
      ((interventionInput.intensity ?? null) === null) !==
        ((interventionInput.intensityUnit ?? null) === null)
    ) {
      throw new DomainError('La intensidad y su unidad deben indicarse juntas.');
    }
    const intervention = new TreatmentIntervention(interventionInput);
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

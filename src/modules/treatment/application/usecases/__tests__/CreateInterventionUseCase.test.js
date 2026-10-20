import { describe, expect, it, vi } from 'vitest';
import { TreatmentRepository } from '../../../domain/ports/TreatmentRepository.js';
import { TreatmentCatalogRepository } from '../../../domain/ports/TreatmentCatalogRepository.js';
import { TreatmentCatalogItem } from '../../../domain/entities/TreatmentCatalogItem.js';
import { CreateInterventionUseCase } from '../TreatmentUseCases.js';

class InMemoryTreatmentRepository extends TreatmentRepository {
  constructor() {
    super();
    this.saveIntervention = vi.fn(async (item) => item);
  }
}

class InMemoryCatalogRepository extends TreatmentCatalogRepository {
  constructor(item) {
    super();
    this.item = item;
  }

  async findById(id) {
    return this.item.id === id ? this.item : null;
  }
}

describe('CreateInterventionUseCase', () => {
  it('uses the active catalog item as the exercise snapshot', async () => {
    const catalogItem = new TreatmentCatalogItem({
      id: 'catalog-1',
      kind: 'exercise',
      code: 'bridge',
      name: 'Puente de glúteos',
      illustrationKey: 'bridge',
    });
    const treatmentRepository = new InMemoryTreatmentRepository();
    const useCase = new CreateInterventionUseCase(
      treatmentRepository,
      new InMemoryCatalogRepository(catalogItem),
    );

    const saved = await useCase.execute({
      clinicalEvaluationId: 'evaluation-1',
      catalogItemId: 'catalog-1',
      kind: 'exercise',
      name: 'Nombre que no corresponde',
      sets: 3,
    });

    expect(saved).toMatchObject({
      name: 'Puente de glúteos',
      catalogItemId: 'catalog-1',
      illustrationKey: 'bridge',
    });
  });

  it('rejects inactive catalog entries and does not persist the intervention', async () => {
    const catalogItem = new TreatmentCatalogItem({
      id: 'catalog-1',
      kind: 'physical_agent',
      code: 'laser',
      name: 'Láser',
      active: false,
    });
    const treatmentRepository = new InMemoryTreatmentRepository();
    const useCase = new CreateInterventionUseCase(
      treatmentRepository,
      new InMemoryCatalogRepository(catalogItem),
    );

    await expect(
      useCase.execute({
        clinicalEvaluationId: 'evaluation-1',
        catalogItemId: 'catalog-1',
        kind: 'physical_agent',
        name: 'Láser',
      }),
    ).rejects.toThrow('El elemento del catálogo no existe, está inactivo o no corresponde al tipo.');
    expect(treatmentRepository.saveIntervention).not.toHaveBeenCalled();
  });
});

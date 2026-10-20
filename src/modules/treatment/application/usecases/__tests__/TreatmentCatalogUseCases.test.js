import { describe, expect, it } from 'vitest';
import { TreatmentCatalogRepository } from '../../../domain/ports/TreatmentCatalogRepository.js';
import { TreatmentCatalogItem } from '../../../domain/entities/TreatmentCatalogItem.js';
import {
  ListTreatmentCatalogUseCase,
  SaveTreatmentCatalogItemUseCase,
} from '../TreatmentCatalogUseCases.js';

class InMemoryCatalogRepository extends TreatmentCatalogRepository {
  constructor(items = []) {
    super();
    this.items = items;
  }

  async list({ activeOnly, kind }) {
    return this.items.filter(
      (item) => (!activeOnly || item.active) && (!kind || item.kind === kind),
    );
  }

  async save(item) {
    this.items.push(item);
    return item;
  }
}

describe('TreatmentCatalogUseCases', () => {
  it('lists only active items of requested kind', async () => {
    const repository = new InMemoryCatalogRepository([
      new TreatmentCatalogItem({ kind: 'exercise', code: 'bridge', name: 'Puente' }),
      new TreatmentCatalogItem({
        kind: 'physical_agent',
        code: 'laser',
        name: 'Láser',
        active: false,
      }),
    ]);

    await expect(
      new ListTreatmentCatalogUseCase(repository).execute({
        activeOnly: true,
        kind: 'exercise',
      }),
    ).resolves.toMatchObject([{ code: 'bridge' }]);
  });

  it('validates and persists a new catalog item', async () => {
    const repository = new InMemoryCatalogRepository();
    const saved = await new SaveTreatmentCatalogItemUseCase(repository).execute({
      kind: 'physical_agent',
      code: 'cryotherapy',
      name: 'Crioterapia',
    });

    expect(saved).toMatchObject({ code: 'cryotherapy', active: true });
    expect(repository.items).toHaveLength(1);
  });
});

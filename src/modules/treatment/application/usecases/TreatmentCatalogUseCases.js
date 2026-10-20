import { TreatmentCatalogRepository } from '../../domain/ports/TreatmentCatalogRepository.js';
import { TreatmentCatalogItem } from '../../domain/entities/TreatmentCatalogItem.js';

class TreatmentCatalogUseCase {
  constructor(repository) {
    if (!(repository instanceof TreatmentCatalogRepository)) {
      throw new TypeError(`${new.target.name} requiere un TreatmentCatalogRepository.`);
    }
    this.repository = repository;
  }
}

export class ListTreatmentCatalogUseCase extends TreatmentCatalogUseCase {
  async execute({ activeOnly = false, kind = null } = {}) {
    const items = await this.repository.list({ activeOnly, kind });
    return items.map((item) => item.toPrimitives());
  }
}

export class SaveTreatmentCatalogItemUseCase extends TreatmentCatalogUseCase {
  async execute(input) {
    const item = new TreatmentCatalogItem(input);
    return (await this.repository.save(item)).toPrimitives();
  }
}

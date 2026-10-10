import { AuditRepository } from '../../domain/ports/AuditRepository.js';

export class ListAuditEventsUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof AuditRepository)) {
      throw new TypeError('ListAuditEventsUseCase requiere un AuditRepository.');
    }
    this.#repository = repository;
  }

  async execute({ limit = 100 } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      throw new RangeError('El límite de auditoría debe estar entre 1 y 200.');
    }
    const events = await this.#repository.findRecent({ limit });
    return events.map((event) => event.toPrimitives());
  }
}

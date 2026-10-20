import { AuditRepository } from '../../domain/ports/AuditRepository.js';

export class ListAuditEventsUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof AuditRepository)) {
      throw new TypeError('ListAuditEventsUseCase requiere un AuditRepository.');
    }
    this.#repository = repository;
  }

  async execute({ page = 1, pageSize = 10 } = {}) {
    if (!Number.isInteger(page) || page < 1) {
      throw new RangeError('La página de auditoría debe ser un entero positivo.');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new RangeError('El tamaño de página de auditoría debe estar entre 1 y 100.');
    }
    const result = await this.#repository.findRecent({
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });
    return {
      events: result.events.map((event) => event.toPrimitives()),
      total: result.total,
    };
  }
}

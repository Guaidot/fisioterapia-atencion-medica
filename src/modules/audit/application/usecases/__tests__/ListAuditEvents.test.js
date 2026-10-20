import { describe, expect, it, vi } from 'vitest';
import { AuditRepository } from '../../../domain/ports/AuditRepository.js';
import { AuditEvent } from '../../../domain/entities/AuditEvent.js';
import { ListAuditEventsUseCase } from '../ListAuditEvents.js';

class InMemoryAuditRepository extends AuditRepository {
  constructor() {
    super();
    this.findRecent = vi.fn(async () => ({
      events: [
        new AuditEvent({
          id: 1,
          entityType: 'patient',
          recordId: 'patient-1',
          action: 'INSERT',
          occurredAt: '2026-10-10T12:00:00.000Z',
        }),
      ],
      total: 41,
    }));
  }
}

describe('ListAuditEventsUseCase', () => {
  it('returns recent events as primitives and forwards pagination offset', async () => {
    const repository = new InMemoryAuditRepository();
    const useCase = new ListAuditEventsUseCase(repository);

    const result = await useCase.execute({ page: 3, pageSize: 10 });

    expect(repository.findRecent).toHaveBeenCalledWith({ offset: 20, limit: 10 });
    expect(result).toMatchObject({
      total: 41,
      events: [{ entityType: 'patient', action: 'INSERT' }],
    });
  });

  it.each([0, -1, 1.5])('rejects invalid page numbers: %s', async (page) => {
    const repository = new InMemoryAuditRepository();
    const useCase = new ListAuditEventsUseCase(repository);

    await expect(useCase.execute({ page })).rejects.toThrow('La página de auditoría debe ser un entero positivo.');
    expect(repository.findRecent).not.toHaveBeenCalled();
  });

  it.each([0, 101, 1.5])('rejects invalid page sizes: %s', async (pageSize) => {
    const repository = new InMemoryAuditRepository();
    const useCase = new ListAuditEventsUseCase(repository);

    await expect(useCase.execute({ pageSize })).rejects.toThrow(
      'El tamaño de página de auditoría debe estar entre 1 y 100.',
    );
    expect(repository.findRecent).not.toHaveBeenCalled();
  });
});

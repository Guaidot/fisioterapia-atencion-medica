import { describe, expect, it, vi } from 'vitest';
import { AuditRepository } from '../../../domain/ports/AuditRepository.js';
import { AuditEvent } from '../../../domain/entities/AuditEvent.js';
import { ListAuditEventsUseCase } from '../ListAuditEvents.js';

class InMemoryAuditRepository extends AuditRepository {
  constructor() {
    super();
    this.findRecent = vi.fn(async () => [
      new AuditEvent({
        id: 1,
        entityType: 'patient',
        recordId: 'patient-1',
        action: 'INSERT',
        occurredAt: '2026-10-10T12:00:00.000Z',
      }),
    ]);
  }
}

describe('ListAuditEventsUseCase', () => {
  it('returns recent events as primitives and forwards bounded limit', async () => {
    const repository = new InMemoryAuditRepository();
    const useCase = new ListAuditEventsUseCase(repository);

    const events = await useCase.execute({ limit: 25 });

    expect(repository.findRecent).toHaveBeenCalledWith({ limit: 25 });
    expect(events[0]).toMatchObject({ entityType: 'patient', action: 'INSERT' });
  });

  it.each([0, 201, 1.5])('rejects invalid event limits: %s', async (limit) => {
    const repository = new InMemoryAuditRepository();
    const useCase = new ListAuditEventsUseCase(repository);

    await expect(useCase.execute({ limit })).rejects.toThrow(
      'El límite de auditoría debe estar entre 1 y 200.',
    );
    expect(repository.findRecent).not.toHaveBeenCalled();
  });
});

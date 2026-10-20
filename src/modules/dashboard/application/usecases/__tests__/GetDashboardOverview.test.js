import { describe, expect, it, vi } from 'vitest';
import { DashboardRepository } from '../../../domain/ports/DashboardRepository.js';
import { GetDashboardOverviewUseCase } from '../GetDashboardOverview.js';

class InMemoryDashboardRepository extends DashboardRepository {
  constructor() {
    super();
    this.getOverview = vi.fn(async () => ({
      activePatients: 24,
      evaluations: [
        { createdAt: '2026-10-20T12:00:00.000Z', zone: 'rodilla', lesionType: 'muscular' },
        { createdAt: '2026-10-19T12:00:00.000Z', zone: 'rodilla', lesionType: 'articular' },
        { createdAt: '2026-10-18T12:00:00.000Z', zone: 'hombro', lesionType: 'muscular' },
        { createdAt: '2026-10-17T12:00:00.000Z', zone: 'codo', lesionType: 'tendinosa' },
      ],
    }));
  }
}

describe('GetDashboardOverviewUseCase', () => {
  it('returns aggregate counts, common categories and recent evaluations', async () => {
    const repository = new InMemoryDashboardRepository();
    const useCase = new GetDashboardOverviewUseCase(repository);

    const result = await useCase.execute({ now: new Date('2026-10-20T12:00:00.000Z') });

    expect(repository.getOverview).toHaveBeenCalledWith({
      since: '2026-09-20T12:00:00.000Z',
      pageSize: 1000,
    });
    expect(result).toMatchObject({
      activePatients: 24,
      periodDays: 30,
      evaluationsCount: 4,
      frequentZones: [
        { value: 'rodilla', count: 2 },
        { value: 'codo', count: 1 },
        { value: 'hombro', count: 1 },
      ],
      frequentLesions: [
        { value: 'muscular', count: 2 },
        { value: 'articular', count: 1 },
        { value: 'tendinosa', count: 1 },
      ],
      recentActivity: [
        { zone: 'rodilla', lesionType: 'muscular' },
        { zone: 'rodilla', lesionType: 'articular' },
        { zone: 'hombro', lesionType: 'muscular' },
        { zone: 'codo', lesionType: 'tendinosa' },
      ],
    });
  });

  it('rejects invalid date parameters', async () => {
    const repository = new InMemoryDashboardRepository();
    const useCase = new GetDashboardOverviewUseCase(repository);

    await expect(useCase.execute({ now: 'not-a-date' })).rejects.toThrow(
      'La fecha para consultar el resumen no es válida.',
    );
    expect(repository.getOverview).not.toHaveBeenCalled();
  });
});

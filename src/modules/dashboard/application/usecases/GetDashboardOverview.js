import { DashboardRepository } from '../../domain/ports/DashboardRepository.js';

const PERIOD_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 5;
const PAGE_SIZE = 1000;

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

export class GetDashboardOverviewUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof DashboardRepository)) {
      throw new TypeError('GetDashboardOverviewUseCase requiere un DashboardRepository.');
    }
    this.#repository = repository;
  }

  async execute({ now = new Date() } = {}) {
    const currentDate = now instanceof Date ? now : new Date(now);
    if (!Number.isFinite(currentDate.getTime())) {
      throw new RangeError('La fecha para consultar el resumen no es válida.');
    }
    const since = new Date(currentDate.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const { activePatients, evaluations } = await this.#repository.getOverview({
      since: since.toISOString(),
      pageSize: PAGE_SIZE,
    });

    return {
      activePatients,
      periodDays: PERIOD_DAYS,
      evaluationsCount: evaluations.length,
      frequentZones: countBy(evaluations, 'zone'),
      frequentLesions: countBy(evaluations, 'lesionType'),
      recentActivity: evaluations.slice(0, RECENT_ACTIVITY_LIMIT),
    };
  }
}

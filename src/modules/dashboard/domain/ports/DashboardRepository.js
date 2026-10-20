import { Port } from '../../../../shared/application/Port.js';

export class DashboardRepository extends Port {
  async getOverview() {
    throw new Error('DashboardRepository.getOverview no implementado');
  }
}

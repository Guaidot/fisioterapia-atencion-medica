import { Port } from '../../../../shared/application/Port.js';

export class AuditRepository extends Port {
  async findRecent() {
    throw new Error('AuditRepository.findRecent no implementado');
  }
}

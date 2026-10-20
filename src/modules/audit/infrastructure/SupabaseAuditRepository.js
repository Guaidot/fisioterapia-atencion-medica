import { AuditRepository } from '../domain/ports/AuditRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import { rowToAuditEvent } from './auditMapper.js';

const TABLE = 'clinical_audit_logs';

export class SupabaseAuditRepository extends AuditRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async findRecent({ offset, limit }) {
    const { data, count, error } = await this.client
      .from(TABLE)
      .select(
        'id, entity_type, record_id, patient_id, action, actor_id, occurred_at, old_data, new_data, actor:profiles!clinical_audit_logs_actor_id_fkey(full_name, email)',
        { count: 'exact' },
      )
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return {
      events: (data ?? []).map(rowToAuditEvent),
      total: count ?? 0,
    };
  }
}

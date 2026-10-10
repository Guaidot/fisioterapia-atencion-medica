import { AuditRepository } from '../domain/ports/AuditRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import { rowToAuditEvent } from './auditMapper.js';

const TABLE = 'clinical_audit_logs';

export class SupabaseAuditRepository extends AuditRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async findRecent({ limit }) {
    const { data, error } = await this.client
      .from(TABLE)
      .select(
        'id, entity_type, record_id, patient_id, action, actor_id, occurred_at, old_data, new_data, actor:profiles!clinical_audit_logs_actor_id_fkey(full_name, email)',
      )
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(rowToAuditEvent);
  }
}

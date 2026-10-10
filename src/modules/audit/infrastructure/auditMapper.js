import { AuditEvent } from '../domain/entities/AuditEvent.js';

export function rowToAuditEvent(row) {
  const actor = row.actor ?? null;
  return new AuditEvent({
    id: row.id,
    entityType: row.entity_type,
    recordId: row.record_id,
    patientId: row.patient_id,
    action: row.action,
    actorId: row.actor_id,
    actorName: actor?.full_name ?? null,
    actorEmail: actor?.email ?? null,
    occurredAt: row.occurred_at,
    oldData: row.old_data,
    newData: row.new_data,
  });
}

import { describe, expect, it } from 'vitest';
import { rowToAuditEvent } from '../auditMapper.js';

describe('rowToAuditEvent', () => {
  it('maps audit data and actor profile', () => {
    const event = rowToAuditEvent({
      id: 1,
      entity_type: 'clinical_evaluation',
      record_id: 'evaluation-1',
      patient_id: 'patient-1',
      action: 'UPDATE',
      actor_id: 'therapist-1',
      occurred_at: '2026-10-10T15:00:00.000Z',
      old_data: { diagnosis: 'Anterior' },
      new_data: { diagnosis: 'Corregido' },
      actor: { full_name: 'Terapeuta', email: 'therapist@example.test' },
    });

    expect(event.toPrimitives()).toMatchObject({
      entityType: 'clinical_evaluation',
      action: 'UPDATE',
      actorName: 'Terapeuta',
      oldData: { diagnosis: 'Anterior' },
      newData: { diagnosis: 'Corregido' },
    });
  });

  it('supports missing actor profiles without hiding the event', () => {
    const event = rowToAuditEvent({
      id: 2,
      entity_type: 'patient',
      record_id: 'patient-1',
      patient_id: 'patient-1',
      action: 'DELETE',
      occurred_at: '2026-10-10T15:00:00.000Z',
    });

    expect(event.actorName).toBeNull();
    expect(event.action).toBe('DELETE');
  });
});

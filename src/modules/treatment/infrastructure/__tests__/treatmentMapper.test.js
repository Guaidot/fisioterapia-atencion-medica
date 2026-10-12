import { describe, expect, it } from 'vitest';
import { TreatmentIntervention } from '../../domain/entities/TreatmentIntervention.js';
import { interventionToRow, rowToIntervention } from '../treatmentMapper.js';

describe('treatment intervention illustration mapping', () => {
  it('persists and restores the selected illustration key', () => {
    const intervention = new TreatmentIntervention({
      clinicalEvaluationId: 'evaluation-1',
      kind: 'exercise',
      name: 'Puente de glúteos',
      sets: 3,
      illustrationKey: 'bridge',
    });

    const row = interventionToRow(intervention);
    const restored = rowToIntervention({
      id: 'intervention-1',
      ...row,
      illustration_key: row.illustration_key,
      created_at: '2026-10-12T12:00:00.000Z',
    });

    expect(row.illustration_key).toBe('bridge');
    expect(restored.illustrationKey).toBe('bridge');
  });
});

import { describe, expect, it } from 'vitest';
import {
  rowToTreatmentCatalogItem,
  treatmentCatalogItemToRow,
} from '../treatmentCatalogMapper.js';
import { TreatmentCatalogItem } from '../../domain/entities/TreatmentCatalogItem.js';

describe('treatmentCatalogMapper', () => {
  it('maps configured agent parameters and attribution', () => {
    const item = rowToTreatmentCatalogItem({
      id: 'catalog-1',
      kind: 'physical_agent',
      code: 'tens-ems',
      name: 'TENS/EMS',
      description: '',
      active: true,
      illustration_key: null,
      parameter_config: {
        fields: ['intensity'],
        intensityUnits: ['mA'],
      },
      created_by: 'admin-1',
      created_at: '2026-10-20T10:00:00.000Z',
      updated_at: '2026-10-20T10:00:00.000Z',
    });

    expect(item.toPrimitives()).toMatchObject({
      id: 'catalog-1',
      createdBy: 'admin-1',
      parameterConfig: { fields: ['intensity'], intensityUnits: ['mA'] },
    });
  });

  it('maps a catalog item to database columns', () => {
    const item = new TreatmentCatalogItem({
      kind: 'exercise',
      code: 'bridge',
      name: 'Puente de glúteos',
      illustrationKey: 'bridge',
    });

    expect(treatmentCatalogItemToRow(item)).toEqual({
      kind: 'exercise',
      code: 'bridge',
      name: 'Puente de glúteos',
      description: '',
      active: true,
      illustration_key: 'bridge',
      parameter_config: {},
    });
  });
});

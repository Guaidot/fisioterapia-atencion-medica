import { describe, expect, it } from 'vitest';
import { DomainError } from '../../../../shared/domain/DomainError.js';
import {
  TreatmentCatalogItem,
} from '../entities/TreatmentCatalogItem.js';

const physicalAgent = {
  kind: 'physical_agent',
  code: 'tens-ems',
  name: 'TENS/EMS',
  parameterConfig: {
    fields: ['intensity', 'applicationMinutes'],
    intensityUnits: ['mA'],
  },
};

describe('TreatmentCatalogItem', () => {
  it('accepts optional configurable agent parameters without doses', () => {
    const item = new TreatmentCatalogItem(physicalAgent);

    expect(item.toPrimitives()).toMatchObject({
      kind: 'physical_agent',
      code: 'tens-ems',
      name: 'TENS/EMS',
      parameterConfig: {
        fields: ['intensity', 'applicationMinutes'],
        intensityUnits: ['mA'],
      },
    });
  });

  it('requires configured intensity units only when intensity is supported', () => {
    expect(
      () =>
        new TreatmentCatalogItem({
          ...physicalAgent,
          parameterConfig: { fields: ['intensity'], intensityUnits: [] },
        }),
    ).toThrow(DomainError);
  });

  it('rejects unsupported parameter names', () => {
    expect(
      () =>
        new TreatmentCatalogItem({
          ...physicalAgent,
          parameterConfig: { fields: ['temperatureCelsius'], intensityUnits: [] },
        }),
    ).toThrow(DomainError);
  });
});

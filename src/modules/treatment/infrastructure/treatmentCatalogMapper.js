import { TreatmentCatalogItem } from '../domain/entities/TreatmentCatalogItem.js';

export function rowToTreatmentCatalogItem(row) {
  return new TreatmentCatalogItem({
    id: row.id,
    kind: row.kind,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    active: row.active,
    illustrationKey: row.illustration_key,
    parameterConfig: row.parameter_config ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function treatmentCatalogItemToRow(item) {
  const value = item.toPrimitives();
  return {
    kind: value.kind,
    code: value.code,
    name: value.name,
    description: value.description,
    active: value.active,
    illustration_key: value.illustrationKey,
    parameter_config: value.parameterConfig,
  };
}

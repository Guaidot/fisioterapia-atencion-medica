import { TreatmentCatalogRepository } from '../domain/ports/TreatmentCatalogRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import {
  rowToTreatmentCatalogItem,
  treatmentCatalogItemToRow,
} from './treatmentCatalogMapper.js';

const TABLE = 'treatment_catalog_items';

export class SupabaseTreatmentCatalogRepository extends TreatmentCatalogRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async list({ activeOnly = false, kind = null } = {}) {
    let query = this.client.from(TABLE).select('*').order('kind').order('name');
    if (activeOnly) query = query.eq('active', true);
    if (kind) query = query.eq('kind', kind);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(rowToTreatmentCatalogItem);
  }

  async findById(id) {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToTreatmentCatalogItem(data) : null;
  }

  async save(item) {
    const row = treatmentCatalogItemToRow(item);
    const query = item.isNew
      ? this.client.from(TABLE).insert(row)
      : this.client.from(TABLE).update(row).eq('id', item.id);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return rowToTreatmentCatalogItem(data);
  }
}

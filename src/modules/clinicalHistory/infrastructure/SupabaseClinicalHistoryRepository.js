import { ClinicalHistoryRepository } from '../domain/ports/ClinicalHistoryRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import { rowToClinicalHistory, clinicalHistoryToRow } from './clinicalHistoryMapper.js';

const TABLE = 'clinical_evaluations';

export class SupabaseClinicalHistoryRepository extends ClinicalHistoryRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async findAll() {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToClinicalHistory);
  }

  async findByPatient(patientId) {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToClinicalHistory);
  }

  async findById(id) {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToClinicalHistory(data) : null;
  }

  async save(history) {
    const row = clinicalHistoryToRow(history);
    if (history.isNew) {
      delete row.id;
      const { data, error } = await this.client.from(TABLE).insert(row).select().single();
      if (error) throw error;
      return rowToClinicalHistory(data);
    }
    const { data, error } = await this.client
      .from(TABLE)
      .update(row)
      .eq('id', history.id)
      .select()
      .single();
    if (error) throw error;
    return rowToClinicalHistory(data);
  }

  async delete(id) {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }
}
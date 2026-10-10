import { PatientRepository } from '../domain/ports/PatientRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import { rowToPatient, patientToRow } from './patientMapper.js';

const TABLE = 'patients';

export class SupabasePatientRepository extends PatientRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async findAll({ archivedOnly = false } = {}) {
    let query = this.client.from(TABLE).select('*');
    query = archivedOnly
      ? query.not('archived_at', 'is', null)
      : query.is('archived_at', null);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPatient);
  }

  async findById(id) {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToPatient(data) : null;
  }

  async existsByCedula(cedula) {
    const { data, error } = await this.client
      .from(TABLE)
      .select('id')
      .eq('cedula', cedula)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async findByCedula(cedula) {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('cedula', cedula)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToPatient(data) : null;
  }

  async save(patient) {
    const row = patientToRow(patient);
    if (patient.isNew) {
      delete row.id;
      const { data, error } = await this.client.from(TABLE).insert(row).select().single();
      if (error) throw error;
      return rowToPatient(data);
    }
    const { data, error } = await this.client
      .from(TABLE)
      .update(row)
      .eq('id', patient.id)
      .select()
      .single();
    if (error) throw error;
    return rowToPatient(data);
  }

  async archive(id) {
    const { error } = await this.client
      .from(TABLE)
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .is('archived_at', null);
    if (error) throw error;
  }

  async restore(id) {
    const { error } = await this.client
      .from(TABLE)
      .update({ archived_at: null })
      .eq('id', id)
      .not('archived_at', 'is', null);
    if (error) throw error;
  }
}
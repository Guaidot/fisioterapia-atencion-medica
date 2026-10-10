import { TreatmentRepository } from '../domain/ports/TreatmentRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import {
  interventionToRow,
  romMeasurementToRow,
  rowToIntervention,
  rowToRomMeasurement,
} from './treatmentMapper.js';

const INTERVENTIONS_TABLE = 'treatment_interventions';
const MEASUREMENTS_TABLE = 'rom_measurements';

export class SupabaseTreatmentRepository extends TreatmentRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async listByEvaluation(clinicalEvaluationId) {
    const { data, error } = await this.client
      .from(INTERVENTIONS_TABLE)
      .select('*')
      .eq('clinical_evaluation_id', clinicalEvaluationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToIntervention);
  }

  async saveIntervention(intervention) {
    const { data, error } = await this.client
      .from(INTERVENTIONS_TABLE)
      .insert(interventionToRow(intervention))
      .select()
      .single();
    if (error) throw error;
    return rowToIntervention(data);
  }

  async listMeasurementsByEvaluation(clinicalEvaluationId) {
    const { data, error } = await this.client
      .from(MEASUREMENTS_TABLE)
      .select('*')
      .eq('clinical_evaluation_id', clinicalEvaluationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToRomMeasurement);
  }

  async listMeasurementsByEvaluations(clinicalEvaluationIds) {
    const { data, error } = await this.client
      .from(MEASUREMENTS_TABLE)
      .select('*')
      .in('clinical_evaluation_id', clinicalEvaluationIds)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToRomMeasurement);
  }

  async saveMeasurement(measurement) {
    const { data, error } = await this.client
      .from(MEASUREMENTS_TABLE)
      .insert(romMeasurementToRow(measurement))
      .select()
      .single();
    if (error) throw error;
    return rowToRomMeasurement(data);
  }
}

import { DashboardRepository } from '../domain/ports/DashboardRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';

export class SupabaseDashboardRepository extends DashboardRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async getOverview({ since, pageSize }) {
    const patientCountQuery = this.client
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null);

    const [patientResult, evaluations] = await Promise.all([
      patientCountQuery,
      this.listRecentEvaluations({ since, pageSize }),
    ]);

    if (patientResult.error) throw patientResult.error;
    return {
      activePatients: patientResult.count ?? 0,
      evaluations,
    };
  }

  async listRecentEvaluations({ since, pageSize }) {
    const evaluations = [];
    let offset = 0;

    while (true) {
      const { data, error } = await this.client
        .from('clinical_evaluations')
        .select('created_at, zone, lesion_type')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;

      const rows = data ?? [];
      evaluations.push(
        ...rows.map((row) => ({
          createdAt: row.created_at,
          zone: row.zone,
          lesionType: row.lesion_type,
        })),
      );
      if (rows.length < pageSize) return evaluations;
      offset += pageSize;
    }
  }
}

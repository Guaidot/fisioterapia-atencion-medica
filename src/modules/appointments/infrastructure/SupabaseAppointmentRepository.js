import { AppointmentRepository } from '../domain/ports/AppointmentRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import { appointmentToRow, rowToAppointment } from './appointmentMapper.js';

const TABLE = 'appointments';
const APPOINTMENT_SELECT =
  '*, patient:patients(id, first_name, last_name, cedula), clinicalEvaluation:clinical_evaluations!appointments_clinical_evaluation_id_fkey(id)';

export class SupabaseAppointmentRepository extends AppointmentRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async findAll() {
    const { data, error } = await this.client
      .from(TABLE)
      .select(APPOINTMENT_SELECT)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToAppointment);
  }

  async findById(id) {
    const { data, error } = await this.client
      .from(TABLE)
      .select(APPOINTMENT_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToAppointment(data) : null;
  }

  async save(appointment) {
    const { data, error } = await this.client
      .from(TABLE)
      .insert(appointmentToRow(appointment))
      .select(APPOINTMENT_SELECT)
      .single();
    if (error) throw error;
    return rowToAppointment(data);
  }

  async updateStatus(id, status) {
    const { data, error } = await this.client
      .from(TABLE)
      .update({ status })
      .eq('id', id)
      .select(APPOINTMENT_SELECT)
      .single();
    if (error) throw error;
    return rowToAppointment(data);
  }

  async reschedule({ id, scheduledAt, durationMinutes }) {
    const { data, error } = await this.client.rpc('reschedule_appointment', {
      p_appointment_id: id,
      p_scheduled_at: scheduledAt,
      p_duration_minutes: durationMinutes,
    });
    if (error) throw error;
    return rowToAppointment(data);
  }
}

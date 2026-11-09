import { Appointment } from '../domain/entities/Appointment.js';

export function rowToAppointment(row) {
  return new Appointment({
    id: row.id,
    patientId: row.patient_id,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    rescheduledFromId: row.rescheduled_from_id,
    rescheduledToId: row.rescheduled_to_id,
    clinicalEvaluationId: row.clinical_evaluation_id,
    createdAt: row.created_at,
    patient: row.patient
      ? {
          id: row.patient.id,
          firstName: row.patient.first_name,
          lastName: row.patient.last_name,
          cedula: row.patient.cedula,
        }
      : null,
  });
}

export function appointmentToRow(appointment) {
  const value = appointment.toPrimitives();
  return {
    patient_id: value.patientId,
    scheduled_at: value.scheduledAt,
    duration_minutes: value.durationMinutes,
    status: value.status,
  };
}

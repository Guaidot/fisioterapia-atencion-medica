import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'attended',
  'no_show',
  'rescheduled',
  'cancelled',
];

export class Appointment extends Entity {
  constructor({
    id = null,
    patientId,
    scheduledAt,
    durationMinutes = null,
    status = 'scheduled',
    rescheduledFromId = null,
    rescheduledToId = null,
    clinicalEvaluationId = null,
    createdAt = null,
    patient = null,
  }) {
    super(id);
    if (!patientId) throw new DomainError('El paciente de la cita es obligatorio.');
    if (!scheduledAt || !Number.isFinite(Date.parse(scheduledAt))) {
      throw new DomainError('La fecha y hora de la cita no son válidas.');
    }
    if (
      durationMinutes != null &&
      (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440)
    ) {
      throw new DomainError('La duración debe ser de 5 a 1440 minutos.');
    }
    if (!APPOINTMENT_STATUSES.includes(status)) {
      throw new DomainError('El estado de la cita no es válido.');
    }
    if (status === 'rescheduled' && !rescheduledToId) {
      throw new DomainError('La cita reprogramada debe conservar el vínculo con su nueva cita.');
    }

    this.patientId = patientId;
    this.scheduledAt = new Date(scheduledAt).toISOString();
    this.durationMinutes = durationMinutes;
    this.status = status;
    this.rescheduledFromId = rescheduledFromId;
    this.rescheduledToId = rescheduledToId;
    this.clinicalEvaluationId = clinicalEvaluationId;
    this.createdAt = createdAt;
    this.patient = patient;
  }

  toPrimitives() {
    return {
      id: this.id,
      patientId: this.patientId,
      scheduledAt: this.scheduledAt,
      durationMinutes: this.durationMinutes,
      status: this.status,
      rescheduledFromId: this.rescheduledFromId,
      rescheduledToId: this.rescheduledToId,
      clinicalEvaluationId: this.clinicalEvaluationId,
      createdAt: this.createdAt,
      patient: this.patient,
    };
  }
}

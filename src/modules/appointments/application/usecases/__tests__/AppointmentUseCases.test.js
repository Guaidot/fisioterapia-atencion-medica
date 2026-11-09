import { describe, expect, it, vi } from 'vitest';
import { Appointment } from '../../../domain/entities/Appointment.js';
import { AppointmentRepository } from '../../../domain/ports/AppointmentRepository.js';
import {
  CreateAppointmentUseCase,
  RescheduleAppointmentUseCase,
  UpdateAppointmentStatusUseCase,
} from '../AppointmentUseCases.js';

class AppointmentRepositoryStub extends AppointmentRepository {
  constructor() {
    super();
    this.appointment = null;
    this.reschedule = vi.fn(async () => this.appointment);
    this.save = vi.fn(async (appointment) => {
      this.appointment = new Appointment({
        ...appointment.toPrimitives(),
        id: 'appointment-1',
      });
      return this.appointment;
    });
    this.updateStatus = vi.fn(async (_id, status) => new Appointment({
      ...this.appointment.toPrimitives(),
      status,
      clinicalEvaluationId: 'evaluation-1',
    }));
    this.findById = vi.fn(async () => this.appointment);
  }
}

describe('Appointment use cases', () => {
  it('creates future appointments and rejects invalid durations', async () => {
    const repository = new AppointmentRepositoryStub();
    const create = new CreateAppointmentUseCase(repository);
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();

    await expect(create.execute({
      patientId: 'patient-1',
      scheduledAt,
      durationMinutes: 45,
    })).resolves.toMatchObject({
      status: 'scheduled',
      durationMinutes: 45,
    });
    expect(repository.save).toHaveBeenCalledOnce();
    await expect(create.execute({
      patientId: 'patient-1',
      scheduledAt,
      durationMinutes: 4,
    })).rejects.toThrow('duración');
  });

  it('only allows cancellation or no-show status transitions', async () => {
    const repository = new AppointmentRepositoryStub();
    const appointment = new Appointment({
      id: 'appointment-1',
      patientId: 'patient-1',
      scheduledAt: new Date(Date.now() + 60_000).toISOString(),
    });
    repository.appointment = appointment;
    const updateStatus = new UpdateAppointmentStatusUseCase(repository);

    await expect(updateStatus.execute({
      id: appointment.id,
      status: 'attended',
    })).rejects.toThrow('no es válida');
    await updateStatus.execute({ id: appointment.id, status: 'cancelled' });
    expect(repository.updateStatus).toHaveBeenCalledWith(appointment.id, 'cancelled');
  });

  it('does not rebook a completed appointment', async () => {
    const repository = new AppointmentRepositoryStub();
    repository.appointment = new Appointment({
      id: 'appointment-1',
      patientId: 'patient-1',
      scheduledAt: new Date(Date.now() + 60_000).toISOString(),
      status: 'attended',
      clinicalEvaluationId: 'evaluation-1',
    });
    const reschedule = new RescheduleAppointmentUseCase(repository);

    await expect(reschedule.execute({
      id: 'appointment-1',
      scheduledAt: new Date(Date.now() + 120_000).toISOString(),
    })).rejects.toThrow('continúan programadas');
    expect(repository.reschedule).not.toHaveBeenCalled();
  });
});

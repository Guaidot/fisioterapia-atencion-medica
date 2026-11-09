import { DomainError } from '../../../../shared/domain/DomainError.js';
import { Appointment } from '../../domain/entities/Appointment.js';
import { AppointmentRepository } from '../../domain/ports/AppointmentRepository.js';

export class ListAppointmentsUseCase {
  #repository;

  constructor(repository) {
    this.#assertRepository(repository);
    this.#repository = repository;
  }

  async execute() {
    return (await this.#repository.findAll()).map((appointment) => appointment.toPrimitives());
  }

  #assertRepository(repository) {
    if (!(repository instanceof AppointmentRepository)) {
      throw new TypeError('ListAppointmentsUseCase requiere un AppointmentRepository.');
    }
  }
}

export class CreateAppointmentUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof AppointmentRepository)) {
      throw new TypeError('CreateAppointmentUseCase requiere un AppointmentRepository.');
    }
    this.#repository = repository;
  }

  async execute(input) {
    const appointment = new Appointment(input);
    if (Date.parse(appointment.scheduledAt) <= Date.now()) {
      throw new DomainError('Programa la cita para una fecha y hora futuras.');
    }
    const saved = await this.#repository.save(appointment);
    return saved.toPrimitives();
  }
}

export class UpdateAppointmentStatusUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof AppointmentRepository)) {
      throw new TypeError('UpdateAppointmentStatusUseCase requiere un AppointmentRepository.');
    }
    this.#repository = repository;
  }

  async execute({ id, status }) {
    if (!id || !['no_show', 'cancelled'].includes(status)) {
      throw new DomainError('La actualización de estado solicitada no es válida.');
    }
    return (await this.#repository.updateStatus(id, status)).toPrimitives();
  }
}

export class RescheduleAppointmentUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof AppointmentRepository)) {
      throw new TypeError('RescheduleAppointmentUseCase requiere un AppointmentRepository.');
    }
    this.#repository = repository;
  }

  async execute({ id, scheduledAt, durationMinutes = null }) {
    if (!id) throw new DomainError('La cita que intentas reprogramar no es válida.');
    const original = await this.#repository.findById(id);
    if (!original || original.status !== 'scheduled') {
      throw new DomainError('Solo puedes reprogramar citas que continúan programadas.');
    }
    const replacement = new Appointment({
      patientId: original.patientId,
      scheduledAt,
      durationMinutes,
    });
    if (Date.parse(replacement.scheduledAt) <= Date.now()) {
      throw new DomainError('Programa la cita para una fecha y hora futuras.');
    }
    return (await this.#repository.reschedule({
      id,
      scheduledAt: replacement.scheduledAt,
      durationMinutes: replacement.durationMinutes,
    })).toPrimitives();
  }
}

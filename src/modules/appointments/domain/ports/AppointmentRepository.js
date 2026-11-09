import { Port } from '../../../../shared/application/Port.js';

export class AppointmentRepository extends Port {
  async findById() {
    throw new Error('AppointmentRepository.findById no implementado');
  }

  async findAll() {
    throw new Error('AppointmentRepository.findAll no implementado');
  }

  async save() {
    throw new Error('AppointmentRepository.save no implementado');
  }

  async updateStatus() {
    throw new Error('AppointmentRepository.updateStatus no implementado');
  }

  async reschedule() {
    throw new Error('AppointmentRepository.reschedule no implementado');
  }
}

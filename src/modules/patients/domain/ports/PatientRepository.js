import { Port } from '../../../../shared/application/Port.js';

/**
 * Puerto del repositorio de pacientes.
 * La infraestructura (Supabase) lo implementa.
 */
export class PatientRepository extends Port {
  async findAll() {
    throw new Error('PatientRepository.findAll no implementado');
  }

  async findById() {
    throw new Error('PatientRepository.findById no implementado');
  }

  async existsByCedula() {
    throw new Error('PatientRepository.existsByCedula no implementado');
  }

  async findByCedula() {
    throw new Error('PatientRepository.findByCedula no implementado');
  }

  async save() {
    throw new Error('PatientRepository.save no implementado');
  }

  async archive() {
    throw new Error('PatientRepository.archive no implementado');
  }

  async restore() {
    throw new Error('PatientRepository.restore no implementado');
  }
}
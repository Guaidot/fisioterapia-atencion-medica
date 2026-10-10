import { Port } from '../../../../shared/application/Port.js';

export class ClinicalHistoryRepository extends Port {
  async findAll() {
    throw new Error('ClinicalHistoryRepository.findAll no implementado');
  }

  async findByPatient() {
    throw new Error('ClinicalHistoryRepository.findByPatient no implementado');
  }

  async findById() {
    throw new Error('ClinicalHistoryRepository.findById no implementado');
  }

  async save() {
    throw new Error('ClinicalHistoryRepository.save no implementado');
  }

  async delete() {
    throw new Error('ClinicalHistoryRepository.delete no implementado');
  }
}
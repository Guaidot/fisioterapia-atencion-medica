import { Port } from '../../../../shared/application/Port.js';

export class TreatmentRepository extends Port {
  async listByEvaluation() {
    throw new Error('TreatmentRepository.listByEvaluation no implementado');
  }

  async saveIntervention() {
    throw new Error('TreatmentRepository.saveIntervention no implementado');
  }

  async listMeasurementsByEvaluation() {
    throw new Error('TreatmentRepository.listMeasurementsByEvaluation no implementado');
  }

  async listMeasurementsByEvaluations() {
    throw new Error('TreatmentRepository.listMeasurementsByEvaluations no implementado');
  }

  async saveMeasurement() {
    throw new Error('TreatmentRepository.saveMeasurement no implementado');
  }
}

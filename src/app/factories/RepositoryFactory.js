import { SupabasePatientRepository } from '../../modules/patients/infrastructure/SupabasePatientRepository.js';
import { SupabaseClinicalHistoryRepository } from '../../modules/clinicalHistory/infrastructure/SupabaseClinicalHistoryRepository.js';
import { SupabaseUserRepository } from '../../modules/users/infrastructure/SupabaseUserRepository.js';
import { SupabaseAuditRepository } from '../../modules/audit/infrastructure/SupabaseAuditRepository.js';
import { SupabaseTreatmentRepository } from '../../modules/treatment/infrastructure/SupabaseTreatmentRepository.js';

/**
 * Factory de repositorios (patrón Factory).
 * Encapsula la creación de adaptadores de infraestructura según el contrato.
 * Agregar un nuevo repositorio = agregar un case aquí (Open/Closed).
 */
export class RepositoryFactory {
  static create(name) {
    switch (name) {
      case 'patient':
        return new SupabasePatientRepository();
      case 'clinicalHistory':
        return new SupabaseClinicalHistoryRepository();
      case 'user':
        return new SupabaseUserRepository();
      case 'audit':
        return new SupabaseAuditRepository();
      case 'treatment':
        return new SupabaseTreatmentRepository();
      default:
        throw new Error(`Repositorio desconocido: ${name}`);
    }
  }
}
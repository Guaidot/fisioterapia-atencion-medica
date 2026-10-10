import { Port } from '../../../../shared/application/Port.js';

/**
 * Puerto de persistencia de usuarios (perfiles/roles).
 */
export class UserRepository extends Port {
  async findAll() {
    throw new Error('UserRepository.findAll no implementado');
  }

  async findById() {
    throw new Error('UserRepository.findById no implementado');
  }

  async findMyProfile() {
    throw new Error('UserRepository.findMyProfile no implementado');
  }

  async save() {
    throw new Error('UserRepository.save no implementado');
  }

  async updateRole() {
    throw new Error('UserRepository.updateRole no implementado');
  }

  async deactivate() {
    throw new Error('UserRepository.deactivate no implementado');
  }
}
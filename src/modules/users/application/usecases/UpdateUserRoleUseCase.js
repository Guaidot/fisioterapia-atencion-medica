import { UserRepository } from '../../domain/ports/UserRepository.js';
import { Role } from '../../domain/entities/Role.js';

export class UpdateUserRoleUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof UserRepository)) {
      throw new TypeError('UpdateUserRoleUseCase requiere un UserRepository.');
    }
    this.#repository = repository;
  }

  async execute(id, role) {
    const validRole = new Role(role);
    const updated = await this.#repository.updateRole(id, validRole.value);
    return updated.toPrimitives();
  }
}
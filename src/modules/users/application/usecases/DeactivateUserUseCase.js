import { UserRepository } from '../../domain/ports/UserRepository.js';

export class DeactivateUserUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof UserRepository)) {
      throw new TypeError('DeactivateUserUseCase requiere un UserRepository.');
    }
    this.#repository = repository;
  }

  async execute(id) {
    await this.#repository.deactivate(id);
  }
}
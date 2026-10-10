import { UserRepository } from '../../domain/ports/UserRepository.js';

export class ListUsersUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof UserRepository)) {
      throw new TypeError('ListUsersUseCase requiere un UserRepository.');
    }
    this.#repository = repository;
  }

  async execute() {
    const users = await this.#repository.findAll();
    return users.map((u) => u.toPrimitives());
  }
}
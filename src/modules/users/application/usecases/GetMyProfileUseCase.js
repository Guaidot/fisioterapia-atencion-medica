import { UserRepository } from '../../domain/ports/UserRepository.js';

export class GetMyProfileUseCase {
  #repository;

  constructor(repository) {
    if (!(repository instanceof UserRepository)) {
      throw new TypeError('GetMyProfileUseCase requiere un UserRepository.');
    }
    this.#repository = repository;
  }

  async execute() {
    const user = await this.#repository.findMyProfile();
    return user ? user.toPrimitives() : null;
  }
}
import { UserProvisioningPort } from '../../domain/ports/UserProvisioningPort.js';
import { User } from '../../domain/entities/User.js';

export class SendUserPasswordResetUseCase {
  #provisioning;

  constructor(provisioning) {
    if (!(provisioning instanceof UserProvisioningPort)) {
      throw new TypeError('SendUserPasswordResetUseCase requiere un UserProvisioningPort.');
    }
    this.#provisioning = provisioning;
  }

  async execute(email) {
    const normalizedEmail = User.assertEmail(email);
    await this.#provisioning.resetPassword(normalizedEmail);
  }
}

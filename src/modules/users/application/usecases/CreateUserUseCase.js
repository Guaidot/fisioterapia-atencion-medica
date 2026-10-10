import { UserProvisioningPort } from '../../domain/ports/UserProvisioningPort.js';
import { User } from '../../domain/entities/User.js';

export class CreateUserUseCase {
  #provisioning;

  constructor(provisioning) {
    if (!(provisioning instanceof UserProvisioningPort)) {
      throw new TypeError('CreateUserUseCase requiere un UserProvisioningPort.');
    }
    this.#provisioning = provisioning;
  }

  async execute({ email, password, fullName, role }) {
    const passwordValidated = User.assertPassword(password);
    const user = new User({ email, fullName, role });

    const created = await this.#provisioning.createAccount({
      email: user.email,
      password: passwordValidated,
      fullName: user.fullName,
      role: user.role.value,
    });

    return created;
  }
}
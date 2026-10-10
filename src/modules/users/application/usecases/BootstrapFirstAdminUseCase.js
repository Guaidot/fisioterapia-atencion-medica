import { UserProvisioningPort } from '../../domain/ports/UserProvisioningPort.js';
import { User } from '../../domain/entities/User.js';
import { ROLES } from '../../domain/entities/Role.js';

export class BootstrapFirstAdminUseCase {
  #provisioning;

  constructor(provisioning) {
    if (!(provisioning instanceof UserProvisioningPort)) {
      throw new TypeError('BootstrapFirstAdminUseCase requiere un UserProvisioningPort.');
    }
    this.#provisioning = provisioning;
  }

  async execute({ email, password, fullName, bootstrapSecret }) {
    const passwordValidated = User.assertPassword(password);
    const user = new User({ email, fullName, role: ROLES.ADMIN });

    return this.#provisioning.bootstrapFirstAdmin({
      email: user.email,
      password: passwordValidated,
      fullName: user.fullName,
      bootstrapSecret,
    });
  }
}
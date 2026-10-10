import { Port } from '../../../../shared/application/Port.js';

/**
 * Puerto de aprovisionamiento y recuperación de cuentas.
 * La infraestructura delega las operaciones privilegiadas a una Edge Function
 * y los correos de recuperación a Supabase Auth.
 */
export class UserProvisioningPort extends Port {
  async createAccount() {
    throw new Error('UserProvisioningPort.createAccount no implementado');
  }

  async bootstrapFirstAdmin() {
    throw new Error('UserProvisioningPort.bootstrapFirstAdmin no implementado');
  }

  async resetPassword() {
    throw new Error('UserProvisioningPort.resetPassword no implementado');
  }
}
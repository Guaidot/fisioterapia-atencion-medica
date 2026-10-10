import { Port } from '../Port.js';

/**
 * Puerto de autenticación. La infraestructura (Supabase Auth) lo implementa.
 */
export class AuthPort extends Port {
  async signIn() {
    throw new Error('AuthPort.signIn no implementado');
  }

  async signOut() {
    throw new Error('AuthPort.signOut no implementado');
  }

  async getCurrentUser() {
    throw new Error('AuthPort.getCurrentUser no implementado');
  }

  async updatePassword() {
    throw new Error('AuthPort.updatePassword no implementado');
  }

  onAuthStateChange() {
    throw new Error('AuthPort.onAuthStateChange no implementado');
  }
}

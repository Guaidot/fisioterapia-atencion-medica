import { AuthPort } from './ports/AuthPort.js';
import { User } from '../../modules/users/domain/entities/User.js';

/**
 * Servicio de autenticación de la capa de aplicación.
 * Recibe el puerto inyectado (bajo acoplamiento, testable).
 */
export class AuthService {
  #port;

  constructor(port) {
    if (!(port instanceof AuthPort)) {
      throw new TypeError('AuthService requiere un AuthPort.');
    }
    this.#port = port;
  }

  async login(email, password) {
    User.assertEmail(email);
    User.assertPassword(password);
    return this.#port.signIn(email, password);
  }

  async logout() {
    return this.#port.signOut();
  }

  async currentUser() {
    return this.#port.getCurrentUser();
  }

  async updatePassword(password) {
    User.assertPassword(password);
    return this.#port.updatePassword(password);
  }

  onAuthChange(callback) {
    return this.#port.onAuthStateChange(callback);
  }
}
import { describe, it, expect } from 'vitest';
import { AuthService } from '../AuthService.js';
import { AuthPort } from '../ports/AuthPort.js';
import { DomainError } from '../../domain/DomainError.js';

class FakeAuthPort extends AuthPort {
  async signIn(email, password) {
    return { email, password };
  }

  async signOut() {
    return null;
  }

  async getCurrentUser() {
    return null;
  }

  async updatePassword(password) {
    return password;
  }

  onAuthStateChange() {
    return { unsubscribe: () => {} };
  }
}

describe('AuthService', () => {
  it('rechaza email inválido antes de iniciar sesión', async () => {
    const service = new AuthService(new FakeAuthPort());

    await expect(service.login('correo-malo', '12345678')).rejects.toThrow(DomainError);
  });

  it('rechaza contraseña corta antes de iniciar sesión', async () => {
    const service = new AuthService(new FakeAuthPort());

    await expect(service.login('usuario@clinica.com', '123')).rejects.toThrow(DomainError);
  });

  it('rechaza una contraseña corta al restablecerla', async () => {
    const service = new AuthService(new FakeAuthPort());

    await expect(service.updatePassword('123')).rejects.toThrow(DomainError);
  });

  it('permite actualizar la contraseña válida', async () => {
    const service = new AuthService(new FakeAuthPort());

    await expect(service.updatePassword('nueva-clave-123')).resolves.toBe('nueva-clave-123');
  });
});

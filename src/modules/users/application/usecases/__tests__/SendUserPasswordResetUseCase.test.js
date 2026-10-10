import { describe, expect, it, vi } from 'vitest';
import { UserProvisioningPort } from '../../../domain/ports/UserProvisioningPort.js';
import { SendUserPasswordResetUseCase } from '../SendUserPasswordResetUseCase.js';

describe('SendUserPasswordResetUseCase', () => {
  it('normalizes the email before requesting a password reset', async () => {
    const provisioning = new (class extends UserProvisioningPort {
      resetPassword = vi.fn().mockResolvedValue(undefined);
    })();
    const useCase = new SendUserPasswordResetUseCase(provisioning);

    await useCase.execute('  USER@CLINICA.COM ');

    expect(provisioning.resetPassword).toHaveBeenCalledWith('user@clinica.com');
  });

  it('rejects invalid email addresses', async () => {
    const provisioning = new (class extends UserProvisioningPort {
      resetPassword = vi.fn();
    })();
    const useCase = new SendUserPasswordResetUseCase(provisioning);

    await expect(useCase.execute('invalid-email')).rejects.toThrow('Correo electrónico inválido.');
    expect(provisioning.resetPassword).not.toHaveBeenCalled();
  });

  it('surfaces provisioning errors', async () => {
    const provisioning = new (class extends UserProvisioningPort {
      resetPassword = vi.fn().mockRejectedValue(new Error('Email provider unavailable'));
    })();
    const useCase = new SendUserPasswordResetUseCase(provisioning);

    await expect(useCase.execute('user@clinica.com')).rejects.toThrow(
      'Email provider unavailable',
    );
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupabaseUserProvisioningAdapter } from '../SupabaseUserProvisioningAdapter.js';

describe('SupabaseUserProvisioningAdapter', () => {
  let client;

  beforeEach(() => {
    client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'public-user-id' } },
          error: null,
        }),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { userId: 'provisioned-user-id' }, error: null }),
      },
    };
  });

  it('registra públicamente sin enviar ni asignar un rol', async () => {
    const adapter = new SupabaseUserProvisioningAdapter(client);

    const user = await adapter.createAccount({
      email: 'persona@example.com',
      password: 'clave-segura',
      fullName: 'Persona Nueva',
      role: 'admin',
    });

    expect(user.id).toBe('public-user-id');
    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'persona@example.com',
      password: 'clave-segura',
      options: { data: { full_name: 'Persona Nueva' } },
    });
    expect(client.functions.invoke).not.toHaveBeenCalled();
  });

  it('envía la asignación de rol a la Edge Function desde una sesión autenticada', async () => {
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null,
    });
    const adapter = new SupabaseUserProvisioningAdapter(client);

    const userId = await adapter.createAccount({
      email: 'terapeuta@example.com',
      password: 'clave-segura',
      fullName: 'Terapeuta',
      role: 'terapeuta',
    });

    expect(userId).toBe('provisioned-user-id');
    expect(client.functions.invoke).toHaveBeenCalledWith('provision-user', {
      body: {
        action: 'create-user',
        email: 'terapeuta@example.com',
        password: 'clave-segura',
        fullName: 'Terapeuta',
        role: 'terapeuta',
      },
    });
  });

  it('envía la clave de bootstrap a la Edge Function', async () => {
    const adapter = new SupabaseUserProvisioningAdapter(client);

    const userId = await adapter.bootstrapFirstAdmin({
      email: 'admin@example.com',
      password: 'clave-segura',
      fullName: 'Administrador',
      bootstrapSecret: 'a'.repeat(32),
    });

    expect(userId).toBe('provisioned-user-id');
    expect(client.functions.invoke).toHaveBeenCalledWith('provision-user', {
      body: {
        action: 'bootstrap-admin',
        email: 'admin@example.com',
        password: 'clave-segura',
        fullName: 'Administrador',
        bootstrapSecret: 'a'.repeat(32),
      },
    });
  });

  it('envía el enlace de recuperación a la ruta para crear una contraseña nueva', async () => {
    const adapter = new SupabaseUserProvisioningAdapter(client);

    await adapter.resetPassword('persona@example.com');

    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith('persona@example.com', {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    });
  });

  it('propaga errores al enviar el enlace de recuperación', async () => {
    client.auth.resetPasswordForEmail.mockResolvedValue({
      error: new Error('No se pudo enviar el correo.'),
    });
    const adapter = new SupabaseUserProvisioningAdapter(client);

    await expect(adapter.resetPassword('persona@example.com')).rejects.toThrow(
      'No se pudo enviar el correo.',
    );
  });
});
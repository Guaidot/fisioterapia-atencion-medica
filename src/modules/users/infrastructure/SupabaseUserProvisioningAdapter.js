import { UserProvisioningPort } from '../domain/ports/UserProvisioningPort.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';

async function invokeProvisioning(client, body, fallbackMessage) {
  const { data, error } = await client.functions.invoke('provision-user', { body });

  if (error) {
    let message = error.message;
    try {
      const responseBody = await error.context?.json();
      message = responseBody?.error || message;
    } catch {
      // Keep the Functions client message when the response has no JSON body.
    }
    throw new Error(message || fallbackMessage);
  }

  if (data?.error) throw new Error(data.error);
  return data?.userId;
}

export class SupabaseUserProvisioningAdapter extends UserProvisioningPort {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async createAccount({ email, password, fullName, role }) {
    const {
      data: { user: currentUser },
    } = await this.client.auth.getUser();

    if (currentUser) {
      return invokeProvisioning(
        this.client,
        { action: 'create-user', email, password, fullName, role },
        'No se pudo crear el usuario.',
      );
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'No se pudo registrar el usuario.');
    }

    if (!data?.user) {
      throw new Error('No se recibió el usuario creado.');
    }

    return data.user;
  }

  async bootstrapFirstAdmin({ email, password, fullName, bootstrapSecret }) {
    return invokeProvisioning(
      this.client,
      { action: 'bootstrap-admin', email, password, fullName, bootstrapSecret },
      'No se pudo crear el primer administrador.',
    );
  }

  async resetPassword(email) {
    const redirectTo = new URL('/restablecer-contrasena', window.location.origin).toString();
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message || 'No se pudo enviar el correo de restablecimiento.');
  }
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Método no permitido.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return respond({ error: 'Falta configurar Supabase en la Edge Function.' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { action, email, password, fullName, role, bootstrapSecret } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';

    if (!normalizedEmail || !normalizedName || typeof password !== 'string' || password.length < 8) {
      return respond({ error: 'Nombre, correo válido y contraseña de al menos 8 caracteres son obligatorios.' }, 400);
    }

    let assignedRole: 'admin' | 'terapeuta' | 'asistente';

    if (action === 'bootstrap-admin') {
      const configuredSecret = Deno.env.get('BOOTSTRAP_SECRET');
      if (
        !configuredSecret ||
        configuredSecret.length < 32 ||
        typeof bootstrapSecret !== 'string' ||
        bootstrapSecret !== configuredSecret
      ) {
        return respond({ error: 'La clave de configuración inicial es incorrecta.' }, 401);
      }

      const { data: existingAdmin, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      if (adminError) return respond({ error: adminError.message }, 500);
      if (existingAdmin) {
        return respond({ error: 'Ya existe un administrador. El setup inicial ya fue utilizado.' }, 409);
      }

      assignedRole = 'admin';
    } else if (action === 'create-user') {
      const accessToken = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!accessToken) return respond({ error: 'Se requiere una sesión de administrador.' }, 401);

      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !userData.user) {
        return respond({ error: 'La sesión no es válida.' }, 401);
      }

      const { data: callerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();
      if (profileError) return respond({ error: profileError.message }, 500);
      if (callerProfile?.role !== 'admin') {
        return respond({ error: 'Solo un administrador puede asignar roles.' }, 403);
      }

      if (!['admin', 'terapeuta', 'asistente'].includes(role)) {
        return respond({ error: 'El rol solicitado no es válido.' }, 400);
      }
      assignedRole = role;
    } else {
      return respond({ error: 'Operación no válida.' }, 400);
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: normalizedName },
    });
    if (createError || !created.user) {
      return respond({ error: createError?.message || 'No se pudo crear la cuenta.' }, 400);
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          email: normalizedEmail,
          full_name: normalizedName,
          role: assignedRole,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (profileUpdateError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return respond({ error: profileUpdateError.message }, 500);
    }

    return respond({ userId: created.user.id });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
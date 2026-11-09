import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { TextField } from '../components/Fields.jsx';
import { useSendUserPasswordReset } from '../../../modules/users/ui/hooks/useUsers.js';

const emailSchema = z.string().trim().email('Correo electrónico inválido.');

export function RequestPasswordResetPage() {
  const sendPasswordReset = useSendUserPasswordReset();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await sendPasswordReset.mutateAsync(parsed.data);
      setSent(true);
    } catch (sendError) {
      setError(sendError.message || 'No se pudo enviar el correo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-center text-xl font-semibold text-brand-700">
          Recuperar contraseña
        </h1>
        {sent ? (
          <div className="mt-4 space-y-4 text-center">
            <p role="status" className="text-sm text-emerald-700">
              Si el correo corresponde a una cuenta, recibirás un enlace para crear una nueva
              contraseña. Revisa también la carpeta de spam.
            </p>
            <Link to="/login" className="btn-primary min-h-11 w-full">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-slate-500">
              Ingresa el correo de tu cuenta y te enviaremos un enlace para cambiar la contraseña.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={error}
                required
              />
              <button type="submit" className="btn-primary min-h-11 w-full" disabled={loading}>
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

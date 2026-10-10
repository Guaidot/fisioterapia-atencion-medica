import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useContainer } from '../../../app/container.jsx';
import { TextField } from '../components/Fields.jsx';

const passwordSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirma la contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export function ResetPasswordPage() {
  const { authService } = useContainer();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const parsed = passwordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await authService.updatePassword(parsed.data.password);
      setSuccess(true);
    } catch (error) {
      const message = error.message || '';
      setErrors({
        _root: /session|token|expired/i.test(message)
          ? 'El enlace de recuperación es inválido o expiró. Solicita al administrador que envíe uno nuevo.'
          : message || 'No se pudo actualizar la contraseña. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-center text-xl font-semibold text-brand-700">
          {success ? 'Contraseña actualizada' : 'Crear nueva contraseña'}
        </h1>
        {success ? (
          <div className="mt-4 space-y-4 text-center">
            <p role="status" className="text-sm text-emerald-700">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link to="/login" className="btn-primary min-h-11 w-full">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-slate-500">
              Ingresa y confirma la contraseña nueva para tu cuenta.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                hint="Mínimo 8 caracteres."
                required
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={errors.confirmPassword}
                required
              />
              {errors._root && (
                <p role="alert" className="text-sm text-red-600">
                  {errors._root}
                </p>
              )}
              <button type="submit" className="btn-primary min-h-11 w-full" disabled={loading}>
                {loading ? 'Actualizando…' : 'Guardar nueva contraseña'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              ¿No puedes usar el enlace?{' '}
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

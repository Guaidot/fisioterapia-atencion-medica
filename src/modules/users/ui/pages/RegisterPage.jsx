import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { TextField } from '../../../../shared/ui/components/Fields.jsx';
import { useCreateUser } from '../hooks/useUsers.js';
import { ROLES } from '../../domain/entities/Role.js';

const registerSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export function RegisterPage() {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);

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
      await createUser.mutateAsync({
        ...parsed.data,
        role: ROLES.ASISTENTE,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors({ _root: err.message || 'No se pudo registrar el usuario.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-7"
            >
              <circle cx="9" cy="8" r="3.5" />
              <path d="M3 20v-1a6 6 0 0 1 6-6h1M19 14v6m-3-3h6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-brand-700">Crear cuenta</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Registra a un usuario para acceder al sistema.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Nombre completo"
            value={form.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            error={errors.fullName}
          />

          <TextField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
          />

          <TextField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            error={errors.password}
            hint="Mínimo 8 caracteres."
          />

          {errors._root && <p className="text-sm text-red-600">{errors._root}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creando…' : 'Registrarse'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

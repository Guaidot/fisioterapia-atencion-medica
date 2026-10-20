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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="card relative w-full max-w-md !rounded-3xl !border-white/80 !bg-white/95 !p-7 shadow-xl shadow-slate-900/[0.06] backdrop-blur sm:!p-9">
        <div className="mb-5 flex justify-center">
          <img
            src="/images/logo_fisio.jpg"
            alt="Logo de Milángela Duarte, fisioterapeuta"
            className="h-36 w-full max-w-[19rem] object-contain sm:h-40"
          />
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

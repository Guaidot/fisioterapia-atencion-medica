import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useContainer } from '../../../app/container.jsx';
import { TextField } from '../components/Fields.jsx';

const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export function LoginPage() {
  const { authService } = useContainer();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname ?? '/pacientes';

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setErrors(fieldErrors);
      setError('');
      return;
    }

    setErrors({});
    setError('');
    setLoading(true);
    try {
      await authService.login(parsed.data.email, parsed.data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="card relative w-full max-w-md !rounded-3xl !border-white/80 !bg-white/95 !p-7 shadow-xl shadow-slate-900/[0.06] backdrop-blur sm:!p-9">
        <div className="mb-4 flex justify-center">
          <img
            src="/images/logo_fisio.jpg"
            alt="Logo de Milángela Duarte, fisioterapeuta"
            className="h-36 w-full max-w-[19rem] object-contain sm:h-40"
          />
        </div>
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight text-slate-900">
          Iniciar sesión
        </h1>
        <p className="mb-7 text-center text-sm text-slate-500">
          Accede a tu espacio de gestión clínica.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="Mínimo 8 caracteres."
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary min-h-12 w-full !rounded-xl shadow-sm shadow-brand-900/10" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="pt-1 text-center text-sm text-slate-500">
            No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
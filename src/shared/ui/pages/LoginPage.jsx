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
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-brand-700">Fisioterapia</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Inicia sesión para acceder al sistema.
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
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <p className="text-center text-sm text-slate-500">
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
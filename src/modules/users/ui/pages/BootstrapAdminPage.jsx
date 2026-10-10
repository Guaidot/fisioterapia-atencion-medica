import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '../../../../shared/ui/components/Fields.jsx';
import { useContainer } from '../../../../app/container.jsx';
import { z } from 'zod';

const bootstrapSchema = z.object({
  fullName: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  bootstrapSecret: z.string().min(32, 'La clave debe tener al menos 32 caracteres.'),
});

export function BootstrapAdminPage() {
  const container = useContainer();
  const useCases = container.getUserUseCases();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', bootstrapSecret: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = bootstrapSchema.safeParse(form);
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
      await useCases.bootstrap.execute(parsed.data);
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors({ _root: err.message || 'No se pudo crear el administrador.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-xl font-semibold text-brand-700">Configuración inicial</h1>
        <p className="mb-6 text-sm text-slate-500">
          Crea el primer Administrador del sistema. Solo debe hacerse una vez.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Nombre completo"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            error={errors.fullName}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            hint="Mínimo 8 caracteres."
          />
          <TextField
            label="Clave de configuración inicial"
            type="password"
            value={form.bootstrapSecret}
            onChange={(e) => set('bootstrapSecret', e.target.value)}
            error={errors.bootstrapSecret}
            hint="Usa la misma clave configurada como BOOTSTRAP_SECRET en Supabase."
          />
          {errors._root && <p className="text-sm text-red-600">{errors._root}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creando…' : 'Crear administrador'}
          </button>
        </form>
      </div>
    </div>
  );
}
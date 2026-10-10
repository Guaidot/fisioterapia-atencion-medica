import { Navigate } from 'react-router-dom';
import { useMyProfile } from '../../modules/users/ui/hooks/useUsers.js';

/**
 * Guarda de rol: comprueba que el perfil autenticado tenga uno de los roles permitidos.
 * Protege la accesibilidad a nivel de UI; la RLS en la BD es la capa real de seguridad.
 */
export function RequireRole({ roles, children }) {
  const { data: profile, isLoading, isError, error } = useMyProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Verificando permisos…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-sm text-red-600">
            No se pudo verificar tu perfil: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(profile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center">
          <h1 className="mb-2 text-lg font-semibold text-slate-700">Acceso restringido</h1>
          <p className="text-sm text-slate-500">
            Tu rol actual ({profile.roleLabel}) no tiene permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
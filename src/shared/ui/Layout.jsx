import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContainer } from '../../app/container.jsx';
import { useMyProfile } from '../../modules/users/ui/hooks/useUsers.js';
import { can } from '../../modules/users/domain/permissions.js';

const NAV_ITEMS = [
  { to: '/pacientes', label: 'Pacientes', permission: 'patients', enabled: true },
  { to: '/usuarios', label: 'Usuarios', permission: 'users', enabled: true },
  { to: '/auditoria', label: 'Auditoría', permission: 'audit', enabled: true },
  { to: '/triaje', label: 'Triaje', permission: 'triaje', enabled: false },
  { to: '/historia', label: 'Historia clínica', permission: 'clinicalHistory', enabled: false },
  { to: '/electroterapia', label: 'Electroterapia', permission: 'electrotherapy', enabled: false },
  { to: '/ejercicios', label: 'Ejercicios / Goniometría', permission: 'exercises', enabled: false },
  { to: '/agenda', label: 'Agenda', permission: 'agenda', enabled: false },
];

export function Layout() {
  const { authService } = useContainer();
  const { data: profile, isLoading, isError } = useMyProfile();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.enabled === false) return false;
    if (!profile) return false;
    return can(profile.role, item.permission);
  });

  async function handleLogout() {
    await authService.logout();
    navigate('/login', { replace: true });
  }

  function renderNavItems() {
    if (isLoading) {
      return <p className="px-3 py-2 text-sm text-slate-400">Cargando menú…</p>;
    }
    if (isError) {
      return <p className="px-3 py-2 text-sm text-red-600">No se pudo cargar el menú.</p>;
    }

    return visibleItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex min-h-11 items-center rounded-xl px-3 py-2 text-sm ${
            isActive
              ? 'bg-brand-50 font-medium text-brand-700'
              : 'text-slate-600 hover:bg-slate-100'
          }`
        }
      >
        {item.label}
      </NavLink>
    ));
  }

  const profileStatus = isLoading
    ? 'Cargando perfil…'
    : isError
      ? 'No se pudo cargar el perfil'
      : profile?.roleLabel || 'Perfil no disponible';

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-base font-semibold text-brand-700">Fisioterapia</p>
          <p className="text-xs text-slate-500">Gestión clínica</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {renderNavItems()}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Cerrar menú de navegación"
            className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className={`relative mb-5 md:mb-6 ${mobileMenuOpen ? 'z-50' : ''}`}>
          <header className="border-b border-slate-200 pb-3 md:flex md:min-h-14 md:items-center md:justify-between md:gap-3 md:pb-4">
          <div className="flex items-center justify-between gap-3 md:contents">
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                F
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-700">Fisioterapia</p>
                <p className="truncate text-xs text-slate-500">Gestión clínica</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 md:order-3">
              <button
                type="button"
                className="btn-ghost min-h-11 !px-3 md:hidden"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? 'Cerrar' : 'Menú'}
              </button>
              <button type="button" className="btn-ghost min-h-11 !px-3" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
          <div className="mt-3 min-w-0 border-t border-slate-100 pt-3 md:mt-0 md:flex-1 md:border-0 md:pt-0">
            <p className="truncate text-sm font-medium text-slate-800 md:text-left">
              {profile?.fullName || (isError ? 'Usuario' : '')}
            </p>
            <p className="text-xs text-slate-500">{profileStatus}</p>
          </div>
          </header>

          {mobileMenuOpen && (
            <nav
              id="mobile-navigation"
              aria-label="Navegación principal"
              className="absolute left-0 right-0 top-full z-50 mt-2 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-900/5 md:hidden"
            >
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Menú principal
              </p>
              {renderNavItems()}
            </nav>
          )}
        </div>

        <Outlet />
      </main>
    </div>
  );
}

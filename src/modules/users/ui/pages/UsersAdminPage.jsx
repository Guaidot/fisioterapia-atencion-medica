import { useState } from 'react';
import { SelectField } from '../../../../shared/ui/components/Fields.jsx';
import {
  useMyProfile,
  useSendUserPasswordReset,
  useUpdateUserRole,
  useUsers,
} from '../hooks/useUsers.js';
import { ALL_ROLES, ROLE_LABELS } from '../../domain/entities/Role.js';

const ROLE_OPTIONS = ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export function UsersAdminPage() {
  const { data: users = [], isLoading, isError, error } = useUsers();
  const { data: currentUser } = useMyProfile();
  const updateUserRole = useUpdateUserRole();
  const sendPasswordReset = useSendUserPasswordReset();
  const [search, setSearch] = useState('');
  const [roleDrafts, setRoleDrafts] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [resetFeedback, setResetFeedback] = useState({});

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [user.fullName, user.email, ROLE_LABELS[user.role]].some((value) =>
      String(value ?? '').toLowerCase().includes(query),
    );
  });

  async function saveRole(user) {
    const role = roleDrafts[user.id] ?? user.role;
    if (role === user.role) return;

    setSavingUserId(user.id);
    setFeedback((current) => ({ ...current, [user.id]: '' }));
    try {
      await updateUserRole.mutateAsync({ id: user.id, role });
      setRoleDrafts((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
      setFeedback((current) => ({ ...current, [user.id]: 'Rol actualizado.' }));
    } catch (updateError) {
      setFeedback((current) => ({
        ...current,
        [user.id]: updateError.message || 'No se pudo actualizar el rol.',
      }));
    } finally {
      setSavingUserId(null);
    }
  }

  async function sendResetEmail(user) {
    setResettingUserId(user.id);
    setResetFeedback((current) => ({ ...current, [user.id]: '' }));
    try {
      await sendPasswordReset.mutateAsync(user.email);
      setResetFeedback((current) => ({
        ...current,
        [user.id]: `Enlace de recuperación enviado a ${user.email}.`,
      }));
    } catch (resetError) {
      setResetFeedback((current) => ({
        ...current,
        [user.id]: resetError.message || 'No se pudo enviar el enlace de recuperación.',
      }));
    } finally {
      setResettingUserId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Cargando usuarios…</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-600">No se pudieron cargar los usuarios: {error.message}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Gestión de usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Usuarios registrados: consulta sus datos y administra sus roles.
        </p>
      </div>

      <div className="mb-4">
        <label className="sr-only" htmlFor="user-search">
          Buscar usuarios
        </label>
        <input
          id="user-search"
          type="search"
          className="input min-h-11 max-w-lg"
          placeholder="Buscar por nombre, correo o rol…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {users.length === 0 ? (
        <div className="card px-4 py-8 text-center">
          <p className="font-medium text-slate-700">Todavía no hay usuarios registrados.</p>
          <p className="mt-1 text-sm text-slate-500">
            Los usuarios pueden crear su cuenta desde la pantalla de registro.
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card px-4 py-8 text-center text-sm text-slate-500">
          No se encontraron usuarios con esa búsqueda.
        </div>
      ) : (
        <section className="space-y-3" aria-label="Usuarios registrados">
          {filteredUsers.map((user) => {
            const selectedRole = roleDrafts[user.id] ?? user.role;
            const isCurrentUser = user.id === currentUser?.id;
            const isSaving = savingUserId === user.id;
            const isResetting = resettingUserId === user.id;
            const hasRoleChange = selectedRole !== user.role;
            const message = feedback[user.id];
            const passwordMessage = resetFeedback[user.id];

            return (
              <article
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words font-semibold text-slate-800">
                      {user.fullName || 'Sin nombre'}
                    </h2>
                    <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      {user.createdAt && (
                        <span className="text-xs text-slate-400">
                          Registrado el {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-4 sm:max-w-xs">
                    <div>
                      <SelectField
                        label="Rol"
                        value={selectedRole}
                        onChange={(event) => {
                          setRoleDrafts((current) => ({
                            ...current,
                            [user.id]: event.target.value,
                          }));
                          setFeedback((current) => ({ ...current, [user.id]: '' }));
                        }}
                        options={ROLE_OPTIONS}
                        disabled={isCurrentUser || isSaving}
                        aria-label={`Rol de ${user.fullName || user.email}`}
                      />
                      {isCurrentUser ? (
                        <p className="mt-1 text-xs text-slate-400">
                          No puedes cambiar el rol de tu propia cuenta.
                        </p>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary mt-3 min-h-11 w-full sm:w-auto"
                          disabled={!hasRoleChange || isSaving}
                          onClick={() => saveRole(user)}
                        >
                          {isSaving ? 'Guardando…' : 'Guardar rol'}
                        </button>
                      )}
                      {message && (
                        <p
                          role={message === 'Rol actualizado.' ? 'status' : 'alert'}
                          className={`mt-2 text-sm ${
                            message === 'Rol actualizado.' ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {message}
                        </p>
                      )}
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        className="btn-ghost min-h-11 w-full justify-start !px-3 text-sm"
                        disabled={isResetting}
                        onClick={() => sendResetEmail(user)}
                      >
                        {isResetting ? 'Enviando enlace…' : 'Enviar recuperación de contraseña'}
                      </button>
                      <p className="mt-1 text-xs text-slate-400">
                        Se enviará un enlace al correo del usuario para que cree una contraseña nueva.
                      </p>
                      {passwordMessage && (
                        <p
                          role={passwordMessage.startsWith('Enlace de recuperación enviado')
                            ? 'status'
                            : 'alert'}
                          className={`mt-2 text-sm ${
                            passwordMessage.startsWith('Enlace de recuperación enviado')
                              ? 'text-emerald-700'
                              : 'text-red-600'
                          }`}
                        >
                          {passwordMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

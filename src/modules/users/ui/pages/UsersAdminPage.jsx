import { useState } from 'react';
import { z } from 'zod';
import { SelectField, TextField } from '../../../../shared/ui/components/Fields.jsx';
import {
  useCreateUser,
  useMyProfile,
  useSendUserPasswordReset,
  useUpdateUserRole,
  useUsers,
} from '../hooks/useUsers.js';
import { ALL_ROLES, ROLE_LABELS } from '../../domain/entities/Role.js';
import { Pagination } from '../../../../shared/ui/components/Pagination.jsx';
import { usePagination } from '../../../../shared/ui/hooks/usePagination.js';

const ROLE_OPTIONS = ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'El nombre es obligatorio.'),
  email: z.string().trim().email('Correo electrónico inválido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  role: z.string().refine((role) => ALL_ROLES.includes(role), 'Selecciona un rol válido.'),
});

export function UsersAdminPage() {
  const { data: users = [], isLoading, isError, error } = useUsers();
  const { data: currentUser } = useMyProfile();
  const createUser = useCreateUser();
  const updateUserRole = useUpdateUserRole();
  const sendPasswordReset = useSendUserPasswordReset();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'asistente',
  });
  const [createErrors, setCreateErrors] = useState({});
  const [creatingUser, setCreatingUser] = useState(false);
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
  const pagination = usePagination(filteredUsers, search);

  function setCreateField(field, value) {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    const parsed = createUserSchema.safeParse(createForm);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setCreateErrors(fieldErrors);
      return;
    }

    setCreateErrors({});
    setCreatingUser(true);
    try {
      await createUser.mutateAsync(parsed.data);
      setCreateForm({ fullName: '', email: '', password: '', role: 'asistente' });
      setShowCreateForm(false);
    } catch (createError) {
      setCreateErrors({
        _root: createError.message || 'No se pudo crear el usuario.',
      });
    } finally {
      setCreatingUser(false);
    }
  }

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
      <div className="page-heading">
        <div>
          <h1 className="page-title">Gestión de usuarios</h1>
          <p className="page-description">
            Crea cuentas y administra los roles de acceso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
          </span>
          <button
            type="button"
            className="btn-primary min-h-11"
            onClick={() => {
              setShowCreateForm((visible) => !visible);
              setCreateErrors({});
            }}
          >
            {showCreateForm ? 'Cancelar' : 'Crear usuario'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="card mb-5 space-y-4">
          <h2 className="font-semibold text-slate-800">Nueva cuenta</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nombre completo"
              autoComplete="name"
              value={createForm.fullName}
              onChange={(event) => setCreateField('fullName', event.target.value)}
              error={createErrors.fullName}
              required
            />
            <TextField
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={createForm.email}
              onChange={(event) => setCreateField('email', event.target.value)}
              error={createErrors.email}
              required
            />
            <TextField
              label="Contraseña temporal"
              type="password"
              autoComplete="new-password"
              value={createForm.password}
              onChange={(event) => setCreateField('password', event.target.value)}
              error={createErrors.password}
              hint="Mínimo 8 caracteres. Puedes enviarle un enlace de recuperación después."
              required
            />
            <SelectField
              label="Rol"
              value={createForm.role}
              onChange={(event) => setCreateField('role', event.target.value)}
              options={ROLE_OPTIONS}
              error={createErrors.role}
              required
            />
          </div>
          {createErrors._root && (
            <p role="alert" className="text-sm text-red-600">
              {createErrors._root}
            </p>
          )}
          <button type="submit" className="btn-primary min-h-11" disabled={creatingUser}>
            {creatingUser ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
      )}

      <div className="mb-5">
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
            Usa “Crear usuario” para agregar la primera cuenta.
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card px-4 py-8 text-center text-sm text-slate-500">
          No se encontraron usuarios con esa búsqueda.
        </div>
      ) : (
        <section className="space-y-3" aria-label="Usuarios registrados">
          {pagination.visibleItems.map((user) => {
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
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5"
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
      {filteredUsers.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={filteredUsers.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  );
}

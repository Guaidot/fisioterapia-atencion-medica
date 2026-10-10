import { ROLES } from './entities/Role.js';

/**
 * Matriz de permisos por módulo.
 * Es la única fuente de verdad para filtrar el menú (UI) y aplicar RLS.
 */
export const PERMISSIONS = Object.freeze({
  patients: [ROLES.ADMIN, ROLES.TERAPEUTA, ROLES.ASISTENTE],
  clinicalHistory: [ROLES.ADMIN, ROLES.TERAPEUTA, ROLES.ASISTENTE],
  electrotherapy: [ROLES.ADMIN, ROLES.TERAPEUTA],
  exercises: [ROLES.ADMIN, ROLES.TERAPEUTA],
  reports: [ROLES.ADMIN, ROLES.TERAPEUTA],
  agenda: [ROLES.ADMIN, ROLES.TERAPEUTA, ROLES.ASISTENTE],
  users: [ROLES.ADMIN],
  audit: [ROLES.ADMIN],
  catalogs: [ROLES.ADMIN],
});

export function can(role, permission) {
  return (PERMISSIONS[permission] ?? []).includes(role);
}

export function allowedRoles(permission) {
  return PERMISSIONS[permission] ?? [];
}
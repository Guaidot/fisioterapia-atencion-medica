import { describe, expect, it } from 'vitest';
import { can } from '../permissions.js';
import { ROLES } from '../entities/Role.js';

describe('clinical access permissions', () => {
  it.each([ROLES.ADMIN, ROLES.TERAPEUTA, ROLES.ASISTENTE])(
    'allows %s to access patients and clinical histories',
    (role) => {
      expect(can(role, 'patients')).toBe(true);
      expect(can(role, 'clinicalHistory')).toBe(true);
    },
  );

  it('restricts user administration to admins', () => {
    expect(can(ROLES.ADMIN, 'users')).toBe(true);
    expect(can(ROLES.TERAPEUTA, 'users')).toBe(false);
    expect(can(ROLES.ASISTENTE, 'users')).toBe(false);
  });

  it('allows therapists to view catalogs but reserves management for admins', () => {
    expect(can(ROLES.ADMIN, 'catalogs')).toBe(true);
    expect(can(ROLES.TERAPEUTA, 'catalogs')).toBe(true);
    expect(can(ROLES.ASISTENTE, 'catalogs')).toBe(false);
    expect(can(ROLES.ADMIN, 'catalogManagement')).toBe(true);
    expect(can(ROLES.TERAPEUTA, 'catalogManagement')).toBe(false);
  });

  it('allows therapists to create exercises without catalog management access', () => {
    expect(can(ROLES.ADMIN, 'catalogExerciseCreate')).toBe(true);
    expect(can(ROLES.TERAPEUTA, 'catalogExerciseCreate')).toBe(true);
    expect(can(ROLES.ASISTENTE, 'catalogExerciseCreate')).toBe(false);
    expect(can(ROLES.TERAPEUTA, 'catalogManagement')).toBe(false);
  });
});

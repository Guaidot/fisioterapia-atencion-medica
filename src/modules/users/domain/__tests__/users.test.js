import { describe, it, expect } from 'vitest';
import { Role, ROLES, ALL_ROLES } from '../entities/Role.js';
import { User } from '../entities/User.js';
import { can } from '../permissions.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

describe('Role', () => {
  it('acepta los 3 roles válidos', () => {
    for (const r of ALL_ROLES) {
      expect(new Role(r).value).toBe(r);
    }
  });

  it('rechaza un rol inválido', () => {
    expect(() => new Role('invitado')).toThrow(DomainError);
  });

  it('identifica al admin', () => {
    expect(new Role(ROLES.ADMIN).isAdmin).toBe(true);
    expect(new Role(ROLES.TERAPEUTA).isAdmin).toBe(false);
  });
});

describe('User', () => {
  it('crea un usuario válido', () => {
    const user = new User({
      email: 'Ana@Clinica.com',
      fullName: 'Ana Pérez',
      role: ROLES.TERAPEUTA,
    });
    expect(user.email).toBe('ana@clinica.com');
    expect(user.role.label).toBe('Terapeuta / Kinesiólogo');
    expect(user.canCreateClinicalHistory).toBe(true);
  });

  it('rechaza email inválido', () => {
    expect(
      () => new User({ email: 'no-es-email', fullName: 'Ana', role: ROLES.ASISTENTE }),
    ).toThrow(DomainError);
  });

  it('valida longitud mínima de contraseña', () => {
    expect(() => User.assertPassword('corta')).toThrow(DomainError);
    expect(User.assertPassword('maslarga123')).toBe('maslarga123');
  });

  it('recepción puede crear historias clínicas según los permisos actuales', () => {
    const user = new User({
      email: 'a@b.com',
      fullName: 'Recepción',
      role: ROLES.ASISTENTE,
    });
    expect(user.canCreateClinicalHistory).toBe(true);
  });
});

describe('permissions', () => {
  it('solo admin gestiona usuarios', () => {
    expect(can(ROLES.ADMIN, 'users')).toBe(true);
    expect(can(ROLES.TERAPEUTA, 'users')).toBe(false);
    expect(can(ROLES.ASISTENTE, 'users')).toBe(false);
  });

  it('recepción accede a pacientes e historia clínica', () => {
    expect(can(ROLES.ASISTENTE, 'patients')).toBe(true);
    expect(can(ROLES.ASISTENTE, 'clinicalHistory')).toBe(true);
    expect(can(ROLES.TERAPEUTA, 'clinicalHistory')).toBe(true);
  });
});
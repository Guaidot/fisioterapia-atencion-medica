import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';
import { Role, ROLES } from './Role.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User extends Entity {
  constructor({ id = null, email, fullName, role, isActive = true, createdAt = null }) {
    super(id);
    this.email = User.assertEmail(email);
    this.fullName = User.assertText(fullName, 'Nombre completo');
    this.role = new Role(role);
    this.isActive = Boolean(isActive);
    this.createdAt = createdAt;
  }

  static assertText(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new DomainError(`${field} es obligatorio.`);
    }
    return value.trim();
  }

  static assertEmail(value) {
    const email = User.assertText(value, 'Correo electrónico').toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new DomainError('Correo electrónico inválido.');
    }
    return email;
  }

  static assertPassword(password) {
    if (typeof password !== 'string' || password.length < 8) {
      throw new DomainError('La contraseña debe tener al menos 8 caracteres.');
    }
    return password;
  }

  get canCreateClinicalHistory() {
    return [ROLES.ADMIN, ROLES.TERAPEUTA, ROLES.ASISTENTE].includes(this.role.value);
  }

  toPrimitives() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role.value,
      roleLabel: this.role.label,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }
}
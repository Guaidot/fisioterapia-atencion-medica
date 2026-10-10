import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  TERAPEUTA: 'terapeuta',
  ASISTENTE: 'asistente',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.TERAPEUTA]: 'Terapeuta / Kinesiólogo',
  [ROLES.ASISTENTE]: 'Asistente / Recepción',
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));

export class Role extends ValueObject {
  constructor(value) {
    super(value);
    this.assert(
      ALL_ROLES.includes(value),
      `Rol inválido. Valores permitidos: ${ALL_ROLES.join(', ')}.`,
    );
  }

  get isAdmin() {
    return this.value === ROLES.ADMIN;
  }

  get label() {
    return ROLE_LABELS[this.value] ?? this.value;
  }
}
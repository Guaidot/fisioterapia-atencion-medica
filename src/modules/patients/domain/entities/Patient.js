import { Entity } from '../../../../shared/domain/Entity.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';
import { Cedula } from '../valueObjects/Cedula.js';
import { Age } from '../valueObjects/Age.js';

export const GENDERS = ['femenino', 'masculino', 'otro'];

export class Patient extends Entity {
  constructor({
    id = null,
    firstName,
    lastName,
    cedula,
    birthDate = null,
    gender,
    phone = '',
    occupation = '',
    therapistId = null,
    createdAt = null,
    archivedAt = null,
  }) {
    super(id);
    this.firstName = Patient.assertText(firstName, 'Nombre');
    this.lastName = Patient.assertText(lastName, 'Apellido');
    this.cedula = new Cedula(cedula);
    this.birthDate = birthDate ? new Date(birthDate) : null;
    if (
      this.birthDate &&
      (!Number.isFinite(this.birthDate.getTime()) ||
        this.birthDate.toISOString().slice(0, 10) > Patient.localDateString(new Date()))
    ) {
      throw new DomainError('La fecha de nacimiento debe ser válida y no futura.');
    }
    this.gender = Patient.assertGender(gender);
    this.phone = Patient.assertPhone(phone ?? '');
    this.occupation = occupation ?? '';
    this.therapistId = therapistId;
    this.createdAt = createdAt;
    this.archivedAt = archivedAt;
    this.#age = this.birthDate ? new Age(this.birthDate) : null;
  }

  #age;

  static assertText(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new DomainError(`${field} es obligatorio.`);
    }
    const text = value.trim();
    if (!/^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u.test(text)) {
      throw new DomainError(`${field} solo puede contener letras, espacios, guiones o apóstrofes.`);
    }
    return text;
  }

  static assertGender(value) {
    if (!GENDERS.includes(value)) {
      throw new DomainError(`Género inválido. Valores permitidos: ${GENDERS.join(', ')}.`);
    }
    return value;
  }

  static assertPhone(value) {
    if (typeof value !== 'string') {
      throw new DomainError('El teléfono debe ser texto con formato telefónico.');
    }
    const phone = value.trim();
    const digits = phone.match(/\d/g) ?? [];
    if (
      phone &&
      (!/^[+\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15)
    ) {
      throw new DomainError('El teléfono debe contener entre 7 y 15 dígitos.');
    }
    return phone;
  }

  static localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get age() {
    return this.#age ? this.#age.value : null;
  }

  toPrimitives() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      cedula: this.cedula.toString(),
      birthDate: this.birthDate ? this.birthDate.toISOString().slice(0, 10) : null,
      age: this.age,
      gender: this.gender,
      phone: this.phone,
      occupation: this.occupation,
      therapistId: this.therapistId,
      createdAt: this.createdAt,
      archivedAt: this.archivedAt,
    };
  }
}
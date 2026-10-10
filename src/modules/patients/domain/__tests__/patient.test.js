import { describe, it, expect } from 'vitest';
import { Patient } from '../entities/Patient.js';
import { Cedula } from '../valueObjects/Cedula.js';
import { Age } from '../valueObjects/Age.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

describe('Patient', () => {
  it('crea un paciente válido y calcula la edad', () => {
    const patient = new Patient({
      firstName: 'María',
      lastName: 'González',
      cedula: '12345678',
      birthDate: '1995-04-10',
      gender: 'femenino',
      phone: '3001234567',
      occupation: 'Docente',
    });
    expect(patient.fullName).toBe('María González');
    expect(patient.toPrimitives().fullName).toBe('María González');
    expect(patient.age).toBeGreaterThan(18);
  });

  it('rechaza un paciente sin nombre', () => {
    expect(
      () =>
        new Patient({
          firstName: '',
          lastName: 'González',
          cedula: '12345678',
          gender: 'femenino',
        }),
    ).toThrow(DomainError);
  });

  it('rechaza cédula inválida', () => {
    expect(() => new Cedula('abc')).toThrow(DomainError);
  });

  it('rechaza género no permitido', () => {
    expect(
      () =>
        new Patient({
          firstName: 'María',
          lastName: 'González',
          cedula: '12345678',
          gender: 'no-binario-x',
        }),
    ).toThrow(DomainError);
  });

  it('rechaza números en los nombres y letras en el teléfono', () => {
    expect(
      () =>
        new Patient({
          firstName: 'María2',
          lastName: 'González',
          cedula: '12345678',
          gender: 'femenino',
        }),
    ).toThrow(DomainError);
    expect(
      () =>
        new Patient({
          firstName: 'María',
          lastName: 'González',
          cedula: '12345678',
          gender: 'femenino',
          phone: '412ABC1234',
        }),
    ).toThrow(DomainError);
  });

  it('rechaza una fecha de nacimiento futura', () => {
    expect(
      () =>
        new Patient({
          firstName: 'María',
          lastName: 'González',
          cedula: '12345678',
          birthDate: '2999-01-01',
          gender: 'femenino',
        }),
    ).toThrow(DomainError);
  });
});

describe('Age', () => {
  it('calcula edad correctamente', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 30);
    expect(new Age(birthDate).value).toBe(30);
  });
});
import { describe, expect, it } from 'vitest';
import { patientSchema } from '../PatientFormPage.jsx';

const validPatient = {
  firstName: 'María José',
  lastName: "D'Ávila-Pérez",
  cedula: '12345678',
  birthDate: '1990-04-15',
  gender: 'femenino',
  phone: '+58 (412) 123-4567',
  occupation: 'Técnica dental',
};

describe('patientSchema', () => {
  it('accepts Spanish names with accents and valid phone formatting', () => {
    expect(patientSchema.safeParse(validPatient).success).toBe(true);
  });

  it.each(['Ana2', 'José!', 'María_Elena'])('rejects invalid name %s', (firstName) => {
    expect(patientSchema.safeParse({ ...validPatient, firstName }).success).toBe(false);
  });

  it('rejects non-numeric phone content and future birth dates', () => {
    expect(patientSchema.safeParse({ ...validPatient, phone: '412ABC1234' }).success).toBe(false);
    expect(patientSchema.safeParse({ ...validPatient, birthDate: '2999-01-01' }).success).toBe(
      false,
    );
  });
});

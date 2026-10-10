import { describe, expect, it } from 'vitest';
import { patientToRow, rowToPatient } from '../patientMapper.js';
import { Patient } from '../../domain/entities/Patient.js';

describe('patientMapper', () => {
  it('maps created_by and archive timestamp from the database', () => {
    const patient = rowToPatient({
      id: 'patient-id',
      first_name: 'Ana',
      last_name: 'Pérez',
      cedula: '12345678',
      birth_date: '1990-01-01',
      gender: 'femenino',
      phone: '',
      occupation: '',
      created_by: 'therapist-id',
      archived_at: '2025-01-01T00:00:00.000Z',
    });

    expect(patient.toPrimitives()).toMatchObject({
      therapistId: 'therapist-id',
      archivedAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('does not write columns that are not in the patients schema', () => {
    const patient = new Patient({
      firstName: 'Ana',
      lastName: 'Pérez',
      cedula: '12345678',
      gender: 'femenino',
    });

    expect(patientToRow(patient)).not.toHaveProperty('therapist_id');
    expect(patientToRow(patient)).not.toHaveProperty('created_by');
  });
});

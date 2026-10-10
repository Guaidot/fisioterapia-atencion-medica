import { describe, expect, it, vi } from 'vitest';
import { SupabasePatientRepository } from '../SupabasePatientRepository.js';

function createRepositoryResponse(response) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(response),
  };
  const client = { from: vi.fn(() => query) };

  return { repository: new SupabasePatientRepository(client), client, query };
}

describe('SupabasePatientRepository.existsByCedula', () => {
  it('returns true when the cédula exists', async () => {
    const { repository, client, query } = createRepositoryResponse({
      data: { id: 'patient-id' },
      error: null,
    });

    await expect(repository.existsByCedula('12345678')).resolves.toBe(true);
    expect(client.from).toHaveBeenCalledWith('patients');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.eq).toHaveBeenCalledWith('cedula', '12345678');
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it('returns false when the cédula does not exist', async () => {
    const { repository } = createRepositoryResponse({ data: null, error: null });

    await expect(repository.existsByCedula('12345678')).resolves.toBe(false);
  });

  it('throws query errors instead of reporting a false result', async () => {
    const error = new Error('Query failed');
    const { repository } = createRepositoryResponse({ data: null, error });

    await expect(repository.existsByCedula('12345678')).rejects.toBe(error);
  });
});

describe('SupabasePatientRepository.findByCedula', () => {
  it('returns the matching patient, including archived status', async () => {
    const row = {
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
    };
    const { repository, client, query } = createRepositoryResponse({ data: row, error: null });

    const patient = await repository.findByCedula('12345678');

    expect(client.from).toHaveBeenCalledWith('patients');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.eq).toHaveBeenCalledWith('cedula', '12345678');
    expect(patient.toPrimitives()).toMatchObject({
      id: 'patient-id',
      fullName: 'Ana Pérez',
      archivedAt: '2025-01-01T00:00:00.000Z',
    });
  });
});

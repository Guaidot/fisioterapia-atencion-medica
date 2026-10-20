import { describe, expect, it } from 'vitest';
import { historySchema } from '../PatientDetailPage.jsx';

const validEvaluation = {
  diagnosis: 'Tendinopatía del hombro',
  lesionType: 'tendinosa',
  zone: 'hombro',
  phase: 'aguda',
  evaScore: '4',
  clinicalObservations: 'Dolor al elevar el brazo.',
  vitalsMeasuredAt: '2026-10-20T13:10',
  bloodPressureSystolic: '120',
  bloodPressureDiastolic: '80',
  oxygenSaturation: '98.5',
  temperatureCelsius: '36.6',
  heartRate: '72',
  sleepHours: '6_8',
  sleepQuality: 'reparador',
  bloodPressureMedications: ['losartan'],
  otherBloodPressureMedication: '',
  otherMedication: 'Vitamina D',
};

describe('historySchema', () => {
  it('converts valid numeric input values to numbers', () => {
    const result = historySchema.safeParse(validEvaluation);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      evaScore: 4,
      bloodPressureSystolic: 120,
      oxygenSaturation: 98.5,
      temperatureCelsius: 36.6,
      heartRate: 72,
      clinicalObservations: 'Dolor al elevar el brazo.',
    });
  });

  it('allows EVA to be omitted when it was not assessed', () => {
    const result = historySchema.safeParse({ ...validEvaluation, evaScore: '' });

    expect(result.success).toBe(true);
    expect(result.data.evaScore).toBeUndefined();
  });

  it.each([
    ['evaScore', '4.5'],
    ['bloodPressureSystolic', '120.5'],
    ['oxygenSaturation', '98.555'],
    ['temperatureCelsius', '36.666'],
    ['temperatureCelsius', '100'],
    ['heartRate', '72.5'],
  ])('rejects invalid numeric format for %s', (field, value) => {
    expect(historySchema.safeParse({ ...validEvaluation, [field]: value }).success).toBe(false);
  });

  it('requires both blood pressure values and a non-empty diagnosis', () => {
    expect(
      historySchema.safeParse({ ...validEvaluation, bloodPressureDiastolic: '' }).success,
    ).toBe(false);
    expect(historySchema.safeParse({ ...validEvaluation, diagnosis: '   ' }).success).toBe(false);
  });

  it('rejects an invalid clinic measurement date and time', () => {
    expect(
      historySchema.safeParse({ ...validEvaluation, vitalsMeasuredAt: '2026-02-30T12:00' })
        .success,
    ).toBe(false);
  });
});

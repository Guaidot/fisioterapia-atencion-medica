import { describe, expect, it } from 'vitest';
import { ClinicalHistory } from '../../domain/entities/ClinicalHistory.js';
import { clinicalHistoryToRow, rowToClinicalHistory } from '../clinicalHistoryMapper.js';

describe('clinicalHistoryMapper', () => {
  it('maps triage fields and creator from the evaluation row', () => {
    const history = rowToClinicalHistory({
      id: 'evaluation-id',
      patient_id: 'patient-id',
      diagnosis: 'Tendinopatía',
      lesion_type: 'tendinosa',
      zone: 'hombro',
      phase: 'aguda',
      eva_score: 4,
      created_by: 'therapist-id',
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      oxygen_saturation: 98,
      temperature_celsius: 36.5,
      heart_rate: 72,
      sleep_hours: '6_8',
      sleep_quality: 'reparador',
      blood_pressure_medications: ['losartan'],
      other_blood_pressure_medication: '',
      other_medication: 'Vitamina D',
      created_at: '2025-01-01T00:00:00.000Z',
    });

    expect(history.toPrimitives()).toMatchObject({
      therapistId: 'therapist-id',
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      oxygenSaturation: 98,
      temperatureCelsius: 36.5,
      heartRate: 72,
      sleepHours: '6_8',
      sleepQuality: 'reparador',
      bloodPressureMedications: ['losartan'],
      otherMedication: 'Vitamina D',
    });
  });

  it('writes triage fields without a nonexistent therapist_id column', () => {
    const history = new ClinicalHistory({
      patientId: 'patient-id',
      diagnosis: 'Tendinopatía',
      lesionType: 'tendinosa',
      zone: 'hombro',
      phase: 'aguda',
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      bloodPressureMedications: ['losartan'],
    });

    expect(clinicalHistoryToRow(history)).toMatchObject({
      patient_id: 'patient-id',
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      blood_pressure_medications: ['losartan'],
    });
    expect(clinicalHistoryToRow(history)).not.toHaveProperty('therapist_id');
  });
});

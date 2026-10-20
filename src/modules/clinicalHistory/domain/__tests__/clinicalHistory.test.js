import { describe, it, expect } from 'vitest';
import { ClinicalHistory } from '../entities/ClinicalHistory.js';
import { EvaScore } from '../valueObjects/EvaScore.js';
import { DomainError } from '../../../../shared/domain/DomainError.js';

describe('ClinicalHistory', () => {
  it('crea una historia válida con nivel EVA', () => {
    const h = new ClinicalHistory({
      patientId: 'p1',
      diagnosis: 'Tendinopatía del manguito rotador',
      lesionType: 'tendinosa',
      zone: 'hombro',
      phase: 'subaguda',
      evaScore: 4,
    });
    expect(h.evaScore.level).toBe('moderado');
  });

  it('rechaza tipo de lesión inválido', () => {
    expect(
      () =>
        new ClinicalHistory({
          patientId: 'p1',
          diagnosis: 'x',
          lesionType: 'quemadura',
          zone: 'hombro',
          phase: 'aguda',
        }),
    ).toThrow(DomainError);
  });

  it('rechaza EVA fuera de rango', () => {
    expect(() => new EvaScore(11)).toThrow(DomainError);
  });

  it('permite dejar EVA sin registrar y conserva las observaciones de la sesión', () => {
    const h = new ClinicalHistory({
      patientId: 'p1',
      diagnosis: 'Tendinopatía del manguito rotador',
      lesionType: 'tendinosa',
      zone: 'hombro',
      phase: 'subaguda',
      clinicalObservations: '  Dolor al elevar el brazo.  ',
    });

    expect(h.evaScore).toBeNull();
    expect(h.toPrimitives()).toMatchObject({
      evaScore: null,
      evaLevel: null,
      clinicalObservations: 'Dolor al elevar el brazo.',
    });
  });

  it('rechaza una fecha y hora de medición no válida', () => {
    expect(
      () =>
        new ClinicalHistory({
          patientId: 'p1',
          diagnosis: 'Tendinopatía del manguito rotador',
          lesionType: 'tendinosa',
          zone: 'hombro',
          phase: 'subaguda',
          vitalsMeasuredAt: 'not-a-timestamp',
        }),
    ).toThrow('La fecha y hora de medición de signos vitales no es válida.');
  });

  it('permite omitir ambos valores de presión arterial', () => {
    const h = new ClinicalHistory({
      patientId: 'p1',
      diagnosis: 'Tendinopatía del manguito rotador',
      lesionType: 'tendinosa',
      zone: 'hombro',
      phase: 'subaguda',
    });

    expect(h.bloodPressureSystolic).toBeNull();
    expect(h.bloodPressureDiastolic).toBeNull();
  });

  it('rechaza una presión arterial incompleta', () => {
    expect(
      () =>
        new ClinicalHistory({
          patientId: 'p1',
          diagnosis: 'Tendinopatía del manguito rotador',
          lesionType: 'tendinosa',
          zone: 'hombro',
          phase: 'subaguda',
          bloodPressureSystolic: 120,
        }),
    ).toThrow('Ingresa ambos valores de la tensión arterial.');
  });

  it('requiere la fecha y hora de medición al registrar signos vitales nuevos', () => {
    expect(
      () =>
        new ClinicalHistory({
          patientId: 'p1',
          diagnosis: 'Tendinopatía del manguito rotador',
          lesionType: 'tendinosa',
          zone: 'hombro',
          phase: 'subaguda',
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
        }),
    ).toThrow('Registra la fecha y hora de medición de los signos vitales.');
  });

  it.each([
    ['saturación', { oxygenSaturation: 101 }],
    ['temperatura', { temperatureCelsius: 0 }],
    ['temperatura', { temperatureCelsius: 100 }],
    ['frecuencia cardíaca', { heartRate: 72.5 }],
  ])('rechaza %s fuera del rango o formato permitido', (_label, vital) => {
    expect(
      () =>
        new ClinicalHistory({
          patientId: 'p1',
          diagnosis: 'Tendinopatía del manguito rotador',
          lesionType: 'tendinosa',
          zone: 'hombro',
          phase: 'subaguda',
          vitalsMeasuredAt: '2026-10-20T17:10:00.000Z',
          ...vital,
        }),
    ).toThrow(DomainError);
  });

  it.each([
    [
      'sistólica',
      {
        bloodPressureSystolic: 120.5,
        bloodPressureDiastolic: 80,
        vitalsMeasuredAt: '2026-10-20T17:10:00.000Z',
      },
    ],
    [
      'diastólica',
      {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 0,
        vitalsMeasuredAt: '2026-10-20T17:10:00.000Z',
      },
    ],
  ])('rechaza presión %s fuera de formato o rango', (_label, bloodPressure) => {
    expect(
      () =>
        new ClinicalHistory({
          patientId: 'p1',
          diagnosis: 'Tendinopatía del manguito rotador',
          lesionType: 'tendinosa',
          zone: 'hombro',
          phase: 'subaguda',
          ...bloodPressure,
        }),
    ).toThrow(DomainError);
  });
});
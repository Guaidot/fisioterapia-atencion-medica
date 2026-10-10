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

  it.each([
    ['sistólica', { bloodPressureSystolic: 120.5, bloodPressureDiastolic: 80 }],
    ['diastólica', { bloodPressureSystolic: 120, bloodPressureDiastolic: 0 }],
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
import { describe, expect, it } from 'vitest';
import { TreatmentIntervention } from '../entities/TreatmentIntervention.js';
import { RomMeasurement } from '../entities/RomMeasurement.js';

describe('TreatmentIntervention', () => {
  it('creates an exercise with optional dosage', () => {
    const intervention = new TreatmentIntervention({
      clinicalEvaluationId: 'evaluation-1',
      kind: 'exercise',
      name: 'Flexión activa de rodilla',
      contraction: 'concentrica',
      sets: 3,
      repetitions: 10,
      illustrationKey: 'bridge',
    });
    expect(intervention.toPrimitives()).toMatchObject({
      kind: 'exercise',
      contraction: 'concentrica',
      sets: 3,
      repetitions: 10,
      illustrationKey: 'bridge',
    });
  });

  it('rejects illustration keys outside the exercise gallery', () => {
    expect(
      () =>
        new TreatmentIntervention({
          clinicalEvaluationId: 'evaluation-1',
          kind: 'exercise',
          name: 'Ejercicio',
          sets: 3,
          illustrationKey: 'unknown',
        }),
    ).toThrow('La ilustración seleccionada no es válida.');
  });

  it('rejects invalid exercise dosage', () => {
    expect(
      () =>
        new TreatmentIntervention({
          clinicalEvaluationId: 'evaluation-1',
          kind: 'exercise',
          name: 'Ejercicio',
          sets: 0,
        }),
    ).toThrow('Las series debe ser un entero positivo.');
  });

  it('requires at least one exercise dose value', () => {
    expect(
      () =>
        new TreatmentIntervention({
          clinicalEvaluationId: 'evaluation-1',
          kind: 'exercise',
          name: 'Ejercicio',
        }),
    ).toThrow('Indica al menos series, repeticiones o duración para el ejercicio.');
  });

  it('creates an agent with technical parameters', () => {
    const intervention = new TreatmentIntervention({
      clinicalEvaluationId: 'evaluation-1',
      kind: 'physical_agent',
      name: 'TENS',
      technicalFrequencyHz: 80,
      intensity: 12,
      intensityUnit: 'mA',
      applicationMinutes: 15,
      mode: 'pulsado',
    });
    expect(intervention.toPrimitives()).toMatchObject({
      kind: 'physical_agent',
      technicalFrequencyHz: 80,
      intensityUnit: 'mA',
      mode: 'pulsado',
    });
  });

  it('allows an agent intervention without parameters when the catalog has none configured', () => {
    const intervention = new TreatmentIntervention({
      clinicalEvaluationId: 'evaluation-1',
      catalogItemId: 'catalog-1',
      kind: 'physical_agent',
      name: 'Crioterapia',
      parameterConfig: { fields: [], intensityUnits: [] },
    });

    expect(intervention.toPrimitives()).toMatchObject({
      catalogItemId: 'catalog-1',
      applicationMinutes: null,
    });
  });

  it('rejects an agent parameter that is not enabled by its catalog', () => {
    expect(
      () =>
        new TreatmentIntervention({
          clinicalEvaluationId: 'evaluation-1',
          catalogItemId: 'catalog-1',
          kind: 'physical_agent',
          name: 'Crioterapia',
          applicationMinutes: 10,
          parameterConfig: { fields: [], intensityUnits: [] },
        }),
    ).toThrow('El catálogo no habilita el parámetro applicationMinutes.');
  });
});

describe('RomMeasurement', () => {
  it('records a ROM value and optional configured reference', () => {
    const measurement = new RomMeasurement({
      clinicalEvaluationId: 'evaluation-1',
      joint: 'Rodilla',
      movement: 'Flexión',
      measurementContext: 'active',
      side: 'derecho',
      degrees: 90,
      referenceMinDegrees: 0,
      referenceMaxDegrees: 135,
    });
    expect(measurement.toPrimitives()).toMatchObject({
      joint: 'Rodilla',
      movement: 'Flexión',
      measurementContext: 'active',
      side: 'derecho',
      degrees: 90,
      referenceMaxDegrees: 135,
    });
  });

  it('rejects impossible values and inverted reference ranges', () => {
    expect(
      () =>
        new RomMeasurement({
          clinicalEvaluationId: 'evaluation-1',
          joint: 'Rodilla',
          movement: 'Flexión',
          degrees: 361,
        }),
    ).toThrow('El rango de movimiento debe estar entre 0 y 360 grados.');

    expect(
      () =>
        new RomMeasurement({
          clinicalEvaluationId: 'evaluation-1',
          joint: 'Rodilla',
          movement: 'Flexión',
          degrees: 90,
          referenceMinDegrees: 120,
          referenceMaxDegrees: 100,
        }),
    ).toThrow('El rango de referencia mínimo no puede superar al máximo.');
  });

  it('rejects an unsupported measurement context', () => {
    expect(
      () =>
        new RomMeasurement({
          clinicalEvaluationId: 'evaluation-1',
          joint: 'Hombro',
          movement: 'Flexión',
          measurementContext: 'unknown',
          degrees: 90,
        }),
    ).toThrow('El contexto de medición no es válido.');
  });

  it('does not permit unvalidated negative range references', () => {
    expect(
      () =>
        new RomMeasurement({
          clinicalEvaluationId: 'evaluation-1',
          joint: 'Rodilla',
          movement: 'Flexión',
          degrees: 90,
          referenceMinDegrees: -1,
        }),
    ).toThrow('El mínimo de referencia debe estar entre 0 y 360 grados.');
  });
});

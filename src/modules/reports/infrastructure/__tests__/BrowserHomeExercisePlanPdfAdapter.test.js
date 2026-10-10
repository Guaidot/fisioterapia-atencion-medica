import { describe, expect, it, vi } from 'vitest';
import { BrowserHomeExercisePlanPdfAdapter } from '../BrowserHomeExercisePlanPdfAdapter.js';

describe('BrowserHomeExercisePlanPdfAdapter', () => {
  it('escapes report values before writing them into the print document', () => {
    const written = [];
    const printWindow = {
      document: {
        open() {},
        write(content) {
          written.push(content);
        },
        close() {},
      },
      focus() {},
      setTimeout(callback) {
        callback();
      },
      print() {},
    };
    vi.stubGlobal('window', { open: () => printWindow });

    new BrowserHomeExercisePlanPdfAdapter().generate({
      patient: { fullName: '<img src=x onerror=alert(1)>' },
      evaluation: {
        diagnosis: 'Test & lesión',
        zone: 'rodilla',
        phase: 'aguda',
        createdAt: '2026-10-10T12:00:00.000Z',
      },
      exercises: [
        {
          name: 'Flexión <activa>',
          contraction: 'concentrica',
          sets: 3,
          repetitions: 10,
          instructions: 'Realizar & revisar',
        },
      ],
    });

    expect(written.join('')).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(written.join('')).toContain('Test &amp; lesión');
    expect(written.join('')).toContain('Flexión &lt;activa&gt;');
    expect(written.join('')).toContain('class="patient-card"');
    expect(written.join('')).toContain('class="dosage"');
    expect(written.join('')).toContain('Imprimir o guardar como PDF');
    expect(written.join('')).toContain('@page { size: A4;');
    expect(written.join('')).toContain('Firma del paciente');
    expect(written.join('')).not.toContain('<img src=x onerror=alert(1)>');
    vi.unstubAllGlobals();
  });

  it('surfaces blocked print windows', () => {
    vi.stubGlobal('window', { open: () => null });
    expect(() =>
      new BrowserHomeExercisePlanPdfAdapter().generate({
        patient: { fullName: 'Paciente' },
        evaluation: { diagnosis: 'Diagnóstico', zone: 'rodilla', phase: 'aguda' },
        exercises: [{ name: 'Ejercicio' }],
      }),
    ).toThrow('El navegador bloqueó la ventana del reporte.');
    vi.unstubAllGlobals();
  });
});

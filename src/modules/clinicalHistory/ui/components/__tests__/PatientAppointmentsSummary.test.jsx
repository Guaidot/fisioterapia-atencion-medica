import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PatientAppointmentsSummary } from '../PatientAppointmentsSummary.jsx';

describe('PatientAppointmentsSummary', () => {
  it('shows separate appointment states and offers scheduling the next appointment', () => {
    const onSchedule = vi.fn();
    render(
      <PatientAppointmentsSummary
        appointmentsQuery={{
          data: [
            {
              id: 'a1',
              scheduledAt: '2026-11-10T14:00:00.000Z',
              status: 'attended',
              durationMinutes: 45,
              clinicalEvaluationId: 'e1',
            },
            {
              id: 'a2',
              scheduledAt: '2026-11-14T14:00:00.000Z',
              status: 'scheduled',
              durationMinutes: null,
              clinicalEvaluationId: null,
            },
          ],
        }}
        onSchedule={onSchedule}
      />,
    );

    expect(screen.getByText('Citas relacionadas')).toBeInTheDocument();
    expect(screen.getByText('Atendida')).toBeInTheDocument();
    expect(screen.getByText('Programada')).toBeInTheDocument();
    expect(screen.getByText('Vinculada a una evaluación clínica')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Programar próxima cita' }));
    expect(onSchedule).toHaveBeenCalledOnce();
  });

  it('shows appointment loading and errors explicitly', () => {
    const { rerender } = render(
      <PatientAppointmentsSummary
        appointmentsQuery={{ isLoading: true, data: [] }}
        onSchedule={vi.fn()}
      />,
    );
    expect(screen.getByText('Cargando citas…')).toBeInTheDocument();

    rerender(
      <PatientAppointmentsSummary
        appointmentsQuery={{ isError: true, error: new Error('red no disponible'), data: [] }}
        onSchedule={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('red no disponible');
  });
});

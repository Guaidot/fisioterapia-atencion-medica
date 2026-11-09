import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvaProgressChart } from '../EvaProgressChart.jsx';

describe('EvaProgressChart', () => {
  it('renders recorded scores in chronological order without interpretation', () => {
    render(
      <EvaProgressChart
        evaluations={[
          { id: 'later', createdAt: '2026-11-02T12:00:00.000Z', evaScore: 7 },
          { id: 'earlier', createdAt: '2026-10-02T12:00:00.000Z', evaScore: 3 },
          { id: 'not-measured', createdAt: '2026-10-15T12:00:00.000Z', evaScore: null },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Gráfica de 2 mediciones de dolor EVA' }))
      .toBeInTheDocument();
    expect(screen.getByText(/no genera una interpretación clínica/)).toBeInTheDocument();
    expect(screen.getByText(/EVA 3 de 10/)).toBeInTheDocument();
    expect(screen.getByText(/EVA 7 de 10/)).toBeInTheDocument();
  });

  it('does not render a progress chart for fewer than two measured scores', () => {
    const { container } = render(
      <EvaProgressChart
        evaluations={[
          { id: 'one', createdAt: '2026-10-02T12:00:00.000Z', evaScore: 4 },
          { id: 'missing', createdAt: '2026-10-15T12:00:00.000Z', evaScore: null },
        ]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

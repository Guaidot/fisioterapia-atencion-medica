import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExerciseIllustrationCarousel } from '../ExerciseIllustrationCarousel.jsx';

const illustration = {
  key: 'sample-exercise',
  label: 'Ejercicio de prueba',
  imagePath: '/images/exercise.webp',
  muscleImagePath: '/images/muscles.webp',
  muscles: 'Músculos de prueba',
};

describe('ExerciseIllustrationCarousel', () => {
  it('navega entre la ilustración del ejercicio y la imagen muscular', () => {
    render(<ExerciseIllustrationCarousel illustration={illustration} />);

    expect(screen.getByAltText('Ilustración de Ejercicio de prueba')).toBeInTheDocument();
    expect(screen.getByText('Ejecución del ejercicio · 1 de 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Imagen siguiente' }));

    expect(screen.getByAltText('Músculos trabajados: Músculos de prueba')).toBeInTheDocument();
    expect(screen.getByText('Músculos principales · 2 de 2')).toBeInTheDocument();
  });

  it('omite los controles cuando solo existe una imagen', () => {
    render(
      <ExerciseIllustrationCarousel
        illustration={{ ...illustration, muscleImagePath: null }}
      />,
    );

    expect(screen.getByAltText('Ilustración de Ejercicio de prueba')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Imagen siguiente' })).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExerciseIllustrationGallery } from '../ExerciseIllustrationGallery.jsx';

const illustration = {
  key: 'sample-exercise',
  label: 'Ejercicio de prueba',
  imagePath: '/images/exercise.webp',
  muscleImagePath: '/images/muscles.webp',
  muscles: 'Músculos de prueba',
};

describe('ExerciseIllustrationGallery', () => {
  it('muestra juntas la ilustración del ejercicio y la imagen muscular', () => {
    render(<ExerciseIllustrationGallery illustration={illustration} />);

    expect(screen.getByAltText('Ilustración de Ejercicio de prueba')).toBeInTheDocument();
    expect(screen.getByAltText('Músculos trabajados: Músculos de prueba')).toBeInTheDocument();
    expect(screen.getByText('Cómo se realiza')).toBeInTheDocument();
    expect(screen.getByText('Ilustración de músculos')).toBeInTheDocument();
  });

  it('muestra la ilustración disponible sin dejar un espacio para una imagen ausente', () => {
    render(
      <ExerciseIllustrationGallery
        illustration={{ ...illustration, muscleImagePath: null }}
      />,
    );

    expect(screen.getByAltText('Ilustración de Ejercicio de prueba')).toBeInTheDocument();
    expect(screen.queryByText('Ilustración de músculos')).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RomMovementImage } from '../RomMovementImage.jsx';
import { ROM_MOVEMENTS } from '../../../romMovements.js';

const AVAILABLE_IMAGES = {
  'Hombro|Flexión': 'medición flexión hombro goniómetro colocación lateral.jpg',
  'Hombro|Extensión': 'hombro-extension.jfif',
  'Hombro|Rotación interna': 'hombro rotacion interna.jfif',
  'Hombro|Rotación externa': 'hombro-rotacion-externa.jfif',
  'Hombro|Abducción': 'hombro-abduccion.jfif',
  'Hombro|Aducción': 'hombro-aduccion.jfif',
  'Codo|Flexión': 'codo-flexion.jfif',
  'Codo|Extensión': 'codo-extension.jfif',
  'Antebrazo|Pronación': 'antebrazo-pronacion.jfif',
  'Antebrazo|Supinación': 'antebrazo-supinacion.jfif',
  'Muñeca|Flexión': 'muneca-flexion.jfif',
  'Muñeca|Extensión': 'muneca-extension.jfif',
  'Muñeca|Desviación radial': 'muneca-desviacion-radial.jfif',
  'Muñeca|Desviación cubital': 'muneca-desviacion-cubital.jfif',
  'Cadera|Flexión': 'cadera-flexion.jfif',
  'Cadera|Extensión': 'cadera-extension.jfif',
  'Cadera|Abducción': 'adera-abduccion.jfif',
  'Cadera|Rotación interna': 'cadera-rotacion-interna.jfif',
  'Cadera|Rotación externa': 'cadera-rotacion-externa.jfif',
  'Rodilla|Flexión': 'rodilla-flexion.jfif',
  'Rodilla|Extensión': 'rodilla-extension.jfif',
  'Tobillo|Dorsiflexión': 'tobillo-dorsiflexion.jfif',
  'Tobillo|Flexión plantar': 'tobillo-flexion-plantar.jfif',
  'Tobillo|Inversión': 'tobillo-inversion.jfif',
  'Cuello|Flexión': 'cuello-flexion.jfif',
  'Cuello|Extensión': 'cuello-extension.jfif',
  'Cuello|Rotación derecha': 'cuello-rotacion-derecha.jfif',
};

describe('RomMovementImage', () => {
  it('maps each available movement to its own image and leaves missing movements without an image', () => {
    const { rerender } = render(<RomMovementImage joint="Hombro" movement="Flexión" />);
    const mappedFiles = new Set();

    for (const { joint, movement } of ROM_MOVEMENTS) {
      rerender(<RomMovementImage joint={joint} movement={movement} />);
      const expectedFile = AVAILABLE_IMAGES[`${joint}|${movement}`];
      const image = screen.queryByRole('img');

      if (!expectedFile) {
        expect(image).not.toBeInTheDocument();
        continue;
      }

      expect(image).toBeInTheDocument();
      expect(image.getAttribute('src')).toContain(encodeURIComponent(expectedFile));
      expect(mappedFiles.has(expectedFile)).toBe(false);
      mappedFiles.add(expectedFile);
    }

    expect(mappedFiles.size).toBe(Object.keys(AVAILABLE_IMAGES).length);
  });

  it('displays an explicit error when the image cannot be loaded', () => {
    render(<RomMovementImage joint="Hombro" movement="Flexión" />);
    fireEvent.error(screen.getByRole('img'));

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo cargar la imagen/i);
  });
});

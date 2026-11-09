import { useEffect, useState } from 'react';

const MOVEMENT_IMAGES = {
  'hombro|flexion': {
    label: 'flexión',
    file: 'medición flexión hombro goniómetro colocación lateral.jpg',
  },
  'hombro|extension': {
    label: 'extensión',
    file: 'hombro-extension.jfif',
  },
  'hombro|rotacion interna': {
    label: 'rotación interna',
    file: 'hombro rotacion interna.jfif',
  },
  'hombro|rotacion externa': { label: 'rotación externa', file: 'hombro-rotacion-externa.jfif' },
  'hombro|abduccion': { label: 'abducción', file: 'hombro-abduccion.jfif' },
  'hombro|aduccion': { label: 'aducción', file: 'hombro-aduccion.jfif' },
  'codo|flexion': { label: 'flexión', file: 'codo-flexion.jfif' },
  'codo|extension': { label: 'extensión', file: 'codo-extension.jfif' },
  'antebrazo|pronacion': { label: 'pronación', file: 'antebrazo-pronacion.jfif' },
  'antebrazo|supinacion': { label: 'supinación', file: 'antebrazo-supinacion.jfif' },
  'muneca|flexion': { label: 'flexión', file: 'muneca-flexion.jfif' },
  'muneca|extension': { label: 'extensión', file: 'muneca-extension.jfif' },
  'muneca|desviacion radial': { label: 'desviación radial', file: 'muneca-desviacion-radial.jfif' },
  'muneca|desviacion cubital': { label: 'desviación cubital', file: 'muneca-desviacion-cubital.jfif' },
  'cadera|flexion': { label: 'flexión', file: 'cadera-flexion.jfif' },
  'cadera|extension': { label: 'extensión', file: 'cadera-extension.jfif' },
  'cadera|abduccion': { label: 'abducción', file: 'adera-abduccion.jfif' },
  'cadera|rotacion interna': { label: 'rotación interna', file: 'cadera-rotacion-interna.jfif' },
  'cadera|rotacion externa': { label: 'rotación externa', file: 'cadera-rotacion-externa.jfif' },
  'rodilla|flexion': { label: 'flexión', file: 'rodilla-flexion.jfif' },
  'rodilla|extension': { label: 'extensión', file: 'rodilla-extension.jfif' },
  'tobillo|dorsiflexion': { label: 'dorsiflexión', file: 'tobillo-dorsiflexion.jfif' },
  'tobillo|flexion plantar': { label: 'flexión plantar', file: 'tobillo-flexion-plantar.jfif' },
  'tobillo|inversion': { label: 'inversión', file: 'tobillo-inversion.jfif' },
  'cuello|flexion': { label: 'flexión', file: 'cuello-flexion.jfif' },
  'cuello|extension': { label: 'extensión', file: 'cuello-extension.jfif' },
  'cuello|rotacion derecha': { label: 'rotación derecha', file: 'cuello-rotacion-derecha.jfif' },
};

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function RomMovementImage({ joint, movement }) {
  const [imageError, setImageError] = useState(false);
  const image = MOVEMENT_IMAGES[`${normalize(joint)}|${normalize(movement)}`];
  const imagePath = image
    ? `${import.meta.env.BASE_URL}images/rom/${encodeURIComponent(image.file)}`
    : null;

  useEffect(() => {
    setImageError(false);
  }, [imagePath]);

  if (!image) return null;

  return (
    <figure className="sm:col-span-2 lg:col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <figcaption className="px-3 pt-3 text-sm font-semibold text-slate-800">
        Colocación del goniómetro: {image.label} de {joint.toLowerCase()}
      </figcaption>
      {imageError ? (
        <p role="alert" className="p-3 text-sm text-red-700">
          No se pudo cargar la imagen. Verifica que esté en public\images\rom con el nombre original.
        </p>
      ) : (
        <img
          src={imagePath}
          alt={`Medición de ${image.label} de ${joint.toLowerCase()} con goniómetro`}
          className="mx-auto max-h-[28rem] w-full object-contain p-3"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}
      <p className="px-3 pb-3 text-xs leading-5 text-slate-500">
        Imagen de referencia para este movimiento; confirma los puntos anatómicos según tu protocolo clínico.
      </p>
    </figure>
  );
}

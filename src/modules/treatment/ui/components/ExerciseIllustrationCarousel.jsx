import { useEffect, useState } from 'react';

export function ExerciseIllustrationCarousel({ illustration }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = [
    {
      label: 'Ejecución del ejercicio',
      imagePath: illustration.imagePath,
      alt: `Ilustración de ${illustration.label}`,
    },
    ...(illustration.muscleImagePath
      ? [{
          label: 'Músculos principales',
          imagePath: illustration.muscleImagePath,
          alt: `Músculos trabajados: ${illustration.muscles}`,
        }]
      : []),
  ];

  useEffect(() => {
    setActiveIndex(0);
  }, [illustration.key]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  function showPrevious() {
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  }

  function showNext() {
    setActiveIndex((index) => (index + 1) % slides.length);
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex min-h-56 items-center justify-center bg-slate-50 p-4 sm:min-h-72">
        <img
          className="max-h-72 w-full object-contain"
          src={activeSlide.imagePath}
          alt={activeSlide.alt}
        />
      </div>
      <figcaption className="space-y-3 border-t border-slate-100 p-3">
        <p aria-live="polite" className="text-center text-sm font-medium text-slate-700">
          {activeSlide.label} · {activeIndex + 1} de {slides.length}
        </p>
        {slides.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="btn-ghost min-h-11"
              aria-label="Imagen anterior"
              onClick={showPrevious}
            >
              Anterior
            </button>
            <div className="flex flex-wrap justify-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${
                    index === activeIndex
                      ? 'border-brand-300 bg-brand-50 font-medium text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                >
                  {slide.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-ghost min-h-11"
              aria-label="Imagen siguiente"
              onClick={showNext}
            >
              Siguiente
            </button>
          </div>
        )}
      </figcaption>
    </figure>
  );
}

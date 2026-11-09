export function ExerciseIllustrationGallery({ illustration }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <figure
        className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white ${
          illustration.muscleImagePath ? '' : 'col-span-2 sm:max-w-md'
        }`}
      >
        <figcaption className="flex min-h-10 items-center border-b border-slate-100 px-2 py-2 text-xs font-semibold leading-4 text-slate-700 sm:px-3 sm:text-sm">
          Cómo se realiza
        </figcaption>
        <div className="flex aspect-square items-center justify-center bg-slate-50 p-2 sm:aspect-[4/3] sm:p-3">
          <img
            className="max-h-full w-full object-contain"
            src={illustration.imagePath}
            alt={`Ilustración de ${illustration.label}`}
          />
        </div>
      </figure>
      {illustration.muscleImagePath && (
        <figure className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <figcaption className="flex min-h-10 items-center border-b border-slate-100 px-2 py-2 text-xs font-semibold leading-4 text-slate-700 sm:px-3 sm:text-sm">
            Ilustración de músculos
          </figcaption>
          <div className="flex aspect-square items-center justify-center bg-slate-50 p-2 sm:aspect-[4/3] sm:p-3">
            <img
              className="max-h-full w-full object-contain"
              src={illustration.muscleImagePath}
              alt={`Músculos trabajados: ${illustration.muscles}`}
            />
          </div>
        </figure>
      )}
    </div>
  );
}

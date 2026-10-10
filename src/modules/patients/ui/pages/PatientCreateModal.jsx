import { useEffect, useRef } from 'react';
import { PatientFormPage } from './PatientFormPage.jsx';

export function PatientCreateModal({
  onClose,
  patient = null,
  onEditExisting,
  onAddHistory,
}) {
  const dialogRef = useRef(null);
  const isEditing = Boolean(patient);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    dialog.showModal();
    return () => dialog.close();
  }, []);

  function closeOnBackdrop(event) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-patient-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={closeOnBackdrop}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50"
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-5"
            >
              <circle cx="9" cy="7" r="3" />
              <path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1M19 8v6m-3-3h6" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h2 id="new-patient-title" className="text-lg font-semibold text-slate-800">
              {isEditing ? 'Editar paciente' : 'Nuevo paciente'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing
                ? 'Actualiza los datos de identificación y contacto.'
                : 'Completa los datos de identificación y contacto.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost shrink-0 !px-2"
          aria-label="Cerrar formulario"
          onClick={onClose}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-5"
          >
            <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      <PatientFormPage
        key={patient?.id ?? 'new-patient'}
        compact
        initial={patient ?? {}}
        isEditing={isEditing}
        onCancel={onClose}
        onSaved={onClose}
        onEditExisting={onEditExisting}
        onAddHistory={onAddHistory}
      />
    </dialog>
  );
}
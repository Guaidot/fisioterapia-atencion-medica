import { useEffect, useRef } from 'react';

export function PatientArchiveModal({ patient, busy, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const patientName =
    patient.fullName || `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'este paciente';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="archive-patient-title"
      aria-describedby="archive-patient-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (!busy && event.target === dialogRef.current) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-6"
            >
              <path d="M5 8h14M7 8l1 12h8l1-12M10 8V5h4v3m-2 3v5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h2 id="archive-patient-title" className="text-lg font-semibold text-slate-900">
              ¿Archivar paciente?
            </h2>
            <p id="archive-patient-description" className="mt-2 text-sm leading-6 text-slate-600">
              ¿Seguro que deseas archivar a <span className="font-semibold">{patientName}</span>?
              Sus datos y evaluaciones se conservarán y podrás restaurarlo después.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Archivando…' : 'Sí, archivar'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

import { useEffect, useRef } from 'react';
import { PatientDetailPage } from './PatientDetailPage.jsx';

export function PatientHistoryModal({ patient, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="patient-history-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-xl bg-slate-50 p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div>
          <h2 id="patient-history-title" className="text-lg font-semibold text-slate-800">
            Historia clínica
          </h2>
          <p className="text-sm text-slate-500">
            {patient.fullName || `${patient.firstName} ${patient.lastName}`.trim()}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost shrink-0 !px-2"
          aria-label="Cerrar historia clínica"
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
      <div className="p-4 sm:p-6">
        <PatientDetailPage patientId={patient.id} embedded />
      </div>
    </dialog>
  );
}

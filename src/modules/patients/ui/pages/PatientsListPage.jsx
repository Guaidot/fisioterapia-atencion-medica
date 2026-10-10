import { useState } from 'react';
import { useArchivePatient, usePatients, useRestorePatient } from '../hooks/usePatients.js';
import { PatientCreateModal } from './PatientCreateModal.jsx';
import { PatientHistoryModal } from '../../../clinicalHistory/ui/pages/PatientHistoryModal.jsx';
import { PatientArchiveModal } from './PatientArchiveModal.jsx';

export function PatientsListPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: patients, isLoading, isError, error } = usePatients({
    archivedOnly: showArchived,
  });
  const archivePatient = useArchivePatient();
  const restorePatient = useRestorePatient();
  const [query, setQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [patientForHistory, setPatientForHistory] = useState(null);
  const [patientToArchive, setPatientToArchive] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [restoringPatientId, setRestoringPatientId] = useState(null);
  const [restoreFeedback, setRestoreFeedback] = useState({});

  const filtered = (patients ?? []).filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.firstName, p.lastName, p.cedula].some((value) =>
      String(value ?? '').toLowerCase().includes(q),
    );
  });

  async function confirmDelete() {
    if (!patientToArchive) return;
    setArchiveError('');
    try {
      await archivePatient.mutateAsync(patientToArchive.id);
      setPatientToArchive(null);
    } catch (err) {
      setArchiveError(err.message || 'No se pudo archivar el paciente. Intenta nuevamente.');
    }
  }

  async function restoreArchivedPatient(patient) {
    setRestoringPatientId(patient.id);
    setRestoreFeedback((current) => ({ ...current, [patient.id]: '' }));
    try {
      await restorePatient.mutateAsync(patient.id);
    } catch (err) {
      setRestoreFeedback((current) => ({
        ...current,
        [patient.id]: err.message || 'No se pudo restaurar el paciente.',
      }));
    } finally {
      setRestoringPatientId(null);
    }
  }

  if (isLoading) return <p className="text-sm text-slate-500">Cargando pacientes…</p>;
  if (isError) return <p className="text-sm text-red-600">Error: {error.message}</p>;

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 lg:text-3xl">
            Pacientes
          </h1>
          <p className="text-sm text-slate-500 lg:text-base">
            {showArchived
              ? 'Pacientes archivados; sus evaluaciones se conservan.'
              : 'Gestión de pacientes y su historia clínica.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            className="btn-ghost min-h-11 w-full sm:w-auto"
            onClick={() => {
              setShowArchived((show) => !show);
              setQuery('');
            }}
          >
            {showArchived ? 'Ver pacientes activos' : 'Ver archivados'}
          </button>
          {!showArchived && (
            <button
              type="button"
              className="btn-primary min-h-11 w-full sm:w-auto"
              onClick={() => setCreateModalOpen(true)}
            >
              Nuevo paciente
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 sm:mb-5">
        <input
          type="search"
          className="input min-h-11 max-w-md lg:text-base"
          placeholder={`Buscar ${showArchived ? 'archivados' : 'pacientes'} por nombre o cédula…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar pacientes por nombre o cédula"
        />
      </div>

      <section className="space-y-3 md:hidden" aria-label="Lista de pacientes">
        {filtered.length === 0 ? (
          <div className="card px-4 py-8 text-center text-sm text-slate-500">
            {showArchived ? 'No hay pacientes archivados.' : 'No se encontraron pacientes.'}
          </div>
        ) : (
          filtered.map((p) => (
            <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words font-semibold text-slate-800">
                    {[p.lastName, p.firstName].filter(Boolean).join(', ') || 'Sin nombre'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Cédula: {p.cedula}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    showArchived ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  {showArchived ? 'Archivado' : p.gender || 'Sin género'}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Edad</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{p.age ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Teléfono</dt>
                  <dd className="mt-0.5 break-words font-medium text-slate-700">{p.phone || '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Ocupación</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{p.occupation || '—'}</dd>
                </div>
              </dl>
              {showArchived ? (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    className="btn-primary min-h-11 w-full"
                    disabled={restoringPatientId === p.id}
                    onClick={() => restoreArchivedPatient(p)}
                  >
                    {restoringPatientId === p.id ? 'Restaurando…' : 'Restaurar paciente'}
                  </button>
                  {restoreFeedback[p.id] && (
                    <p role="alert" className="mt-2 text-sm text-red-600">
                      {restoreFeedback[p.id]}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    className="btn-ghost min-h-11 !px-2 text-xs"
                    onClick={() => setPatientForHistory(p)}
                  >
                    Historia
                  </button>
                  <button
                    type="button"
                    className="btn-ghost min-h-11 !px-2 text-xs"
                    onClick={() => setPatientToEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-ghost min-h-11 !px-2 text-xs text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      setArchiveError('');
                      setPatientToArchive(p);
                    }}
                  >
                    Archivar
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <div className="card hidden overflow-x-auto p-0 md:block">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {showArchived ? 'No hay pacientes archivados.' : 'No se encontraron pacientes.'}
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm lg:text-base">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium lg:px-5 lg:py-4">Apellido y nombre</th>
                <th className="px-4 py-3 font-medium lg:px-5 lg:py-4">Cédula</th>
                <th className="px-4 py-3 font-medium lg:px-5 lg:py-4">Edad</th>
                <th className="px-4 py-3 font-medium lg:px-5 lg:py-4">Género</th>
                <th className="px-4 py-3 font-medium lg:px-5 lg:py-4">Teléfono</th>
                <th className="px-4 py-3 font-medium lg:px-5 lg:py-4">Ocupación</th>
                <th className="px-4 py-3 lg:px-5 lg:py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800 lg:px-5 lg:py-4">
                    {[p.lastName, p.firstName].filter(Boolean).join(', ') || 'Sin nombre'}
                  </td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4">{p.cedula}</td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4">{p.age ?? '—'}</td>
                  <td className="px-4 py-3 capitalize lg:px-5 lg:py-4">{p.gender}</td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4">{p.phone || '—'}</td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4">{p.occupation || '—'}</td>
                  <td className="px-4 py-3 text-right lg:px-5 lg:py-4">
                    <div className="flex justify-end gap-2">
                      {!showArchived && (
                        <>
                          <button
                            type="button"
                            className="btn-ghost min-h-10 !py-2 text-sm"
                            onClick={() => setPatientForHistory(p)}
                          >
                            Ver historia
                          </button>
                          <button
                            type="button"
                            className="btn-ghost min-h-10 !py-2 text-sm"
                            onClick={() => setPatientToEdit(p)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn-ghost min-h-10 !py-2 text-sm text-amber-700 hover:bg-amber-50"
                            onClick={() => {
                              setArchiveError('');
                              setPatientToArchive(p);
                            }}
                          >
                            Archivar
                          </button>
                        </>
                      )}
                      {showArchived && (
                        <div>
                          <button
                            type="button"
                            className="btn-ghost min-h-10 !py-2 text-sm text-brand-700"
                            disabled={restoringPatientId === p.id}
                            onClick={() => restoreArchivedPatient(p)}
                          >
                            {restoringPatientId === p.id ? 'Restaurando…' : 'Restaurar'}
                          </button>
                          {restoreFeedback[p.id] && (
                            <p role="alert" className="mt-1 max-w-48 text-left text-xs text-red-600">
                              {restoreFeedback[p.id]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createModalOpen && (
        <PatientCreateModal
          onClose={() => setCreateModalOpen(false)}
          onEditExisting={(patient) => {
            setCreateModalOpen(false);
            setPatientToEdit(patient);
          }}
          onAddHistory={(patient) => {
            setCreateModalOpen(false);
            setPatientForHistory(patient);
          }}
        />
      )}
      {patientToEdit && (
        <PatientCreateModal patient={patientToEdit} onClose={() => setPatientToEdit(null)} />
      )}
      {patientForHistory && (
        <PatientHistoryModal patient={patientForHistory} onClose={() => setPatientForHistory(null)} />
      )}
      {patientToArchive && (
        <PatientArchiveModal
          patient={patientToArchive}
          busy={archivePatient.isPending}
          error={archiveError}
          onCancel={() => setPatientToArchive(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
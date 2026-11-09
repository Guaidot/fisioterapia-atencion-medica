import { useState } from 'react';
import { SelectField, TextField } from '../../../../shared/ui/components/Fields.jsx';
import { EXERCISE_ILLUSTRATIONS } from '../../exerciseIllustrations.js';
import {
  AGENT_PARAMETER_FIELDS,
  INTENSITY_UNITS,
} from '../../domain/entities/TreatmentCatalogItem.js';
import { can } from '../../../users/domain/permissions.js';
import { useMyProfile } from '../../../users/ui/hooks/useUsers.js';
import { useSaveTreatmentCatalogItem, useTreatmentCatalog } from '../hooks/useTreatmentCatalog.js';
import { Pagination } from '../../../../shared/ui/components/Pagination.jsx';
import { usePagination } from '../../../../shared/ui/hooks/usePagination.js';
import { ExerciseIllustrationCarousel } from '../components/ExerciseIllustrationCarousel.jsx';

const KINDS = [
  { value: 'exercise', label: 'Ejercicio' },
  { value: 'physical_agent', label: 'Agente físico' },
];

const PARAMETER_LABELS = {
  technicalFrequencyHz: 'Frecuencia técnica (Hz)',
  intensity: 'Intensidad',
  applicationMinutes: 'Duración (minutos)',
  mode: 'Modo (continuo/pulsado)',
};

const EMPTY_FORM = {
  id: null,
  kind: 'exercise',
  code: '',
  name: '',
  description: '',
  active: true,
  illustrationKey: '',
  fields: [],
  intensityUnits: [],
};

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formFromItem(item) {
  return {
    id: item.id,
    kind: item.kind,
    code: item.code,
    name: item.name,
    description: item.description,
    active: item.active,
    illustrationKey: item.illustrationKey ?? '',
    fields: item.parameterConfig.fields ?? [],
    intensityUnits: item.parameterConfig.intensityUnits ?? [],
  };
}

export function TreatmentCatalogPage() {
  const { data: profile } = useMyProfile();
  const canManage = can(profile?.role, 'catalogManagement');
  const canCreateExercise = can(profile?.role, 'catalogExerciseCreate');
  const { data: items = [], isLoading, isError, error } = useTreatmentCatalog({
    activeOnly: !canManage,
  });
  const saveItem = useSaveTreatmentCatalogItem();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [formError, setFormError] = useState('');
  const isEditing = Boolean(form.id);
  const canSaveForm = canManage || (canCreateExercise && !isEditing);
  const selectedIllustration = EXERCISE_ILLUSTRATIONS.find(
    (illustration) => illustration.key === form.illustrationKey,
  );
  const filteredItems = items.filter((item) =>
    [item.name, item.description, item.kind].some((value) =>
      String(value ?? '').toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );
  const pagination = usePagination(filteredItems, search);

  function changeKind(kind) {
    setForm({ ...EMPTY_FORM, kind });
    setFormError('');
  }

  function editItem(item) {
    setForm(formFromItem(item));
    setFeedback('');
    setFormError('');
  }

  async function submit(event) {
    event.preventDefault();
    setFeedback('');
    setFormError('');
    try {
      const code = form.code || slug(form.name);
      const item = {
        id: form.id,
        kind: form.kind,
        code,
        name: form.name,
        description: form.description,
        active: form.active,
        illustrationKey: form.kind === 'exercise' ? form.illustrationKey || null : null,
        parameterConfig:
          form.kind === 'physical_agent'
            ? { fields: form.fields, intensityUnits: form.fields.includes('intensity') ? form.intensityUnits : [] }
            : {},
      };
      await saveItem.mutateAsync(item);
      setForm({ ...EMPTY_FORM });
      setFeedback('Elemento de catálogo guardado.');
    } catch (saveError) {
      setFormError(saveError.message || 'No se pudo guardar el elemento del catálogo.');
    }
  }

  function toggleField(field, checked) {
    setForm((current) => ({
      ...current,
      fields: checked
        ? [...current.fields, field]
        : current.fields.filter((value) => value !== field),
    }));
  }

  function toggleUnit(unit, checked) {
    setForm((current) => ({
      ...current,
      intensityUnits: checked
        ? [...current.intensityUnits, unit]
        : current.intensityUnits.filter((value) => value !== unit),
    }));
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Catálogo terapéutico</h1>
          <p className="page-description">
            {canManage
              ? 'Administra ejercicios y agentes físicos. Los parámetros solo identifican campos y unidades disponibles; no incluyen dosis ni recomendaciones clínicas.'
              : canCreateExercise
                ? 'Consulta los elementos disponibles y agrega ejercicios al catálogo. La dosificación queda a criterio del profesional.'
                : 'Consulta los ejercicios y agentes físicos disponibles para seleccionarlos durante la evaluación. La dosificación queda a criterio del profesional.'}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
          {filteredItems.length} {filteredItems.length === 1 ? 'elemento' : 'elementos'}
        </span>
      </header>

      {canSaveForm && (
        <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-semibold text-slate-800">
          {isEditing ? 'Editar elemento' : canManage ? 'Agregar elemento' : 'Agregar ejercicio'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {canManage ? (
            <SelectField
              label="Tipo"
              value={form.kind}
              disabled={isEditing}
              onChange={(event) => changeKind(event.target.value)}
              options={KINDS}
            />
          ) : (
            <p className="text-sm text-slate-700">Tipo: Ejercicio terapéutico</p>
          )}
          <TextField
            label="Nombre"
            required
            maxLength={200}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </div>
        <TextField
          label="Descripción (opcional)"
          maxLength={1000}
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />

        {form.kind === 'exercise' ? (
          <>
            <SelectField
              label="Recurso visual (opcional)"
              value={form.illustrationKey}
              onChange={(event) =>
                setForm((current) => ({ ...current, illustrationKey: event.target.value }))
              }
              options={[
                { value: '', label: 'Sin ilustración' },
                ...EXERCISE_ILLUSTRATIONS.map(({ key, label }) => ({ value: key, label })),
              ]}
            />
            {selectedIllustration && (
              <ExerciseIllustrationCarousel illustration={selectedIllustration} />
            )}
          </>
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                Parámetros que pueden registrarse para este agente
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {AGENT_PARAMETER_FIELDS.map((field) => (
                  <label key={field} className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.fields.includes(field)}
                      onChange={(event) => toggleField(field, event.target.checked)}
                    />
                    {PARAMETER_LABELS[field]}
                  </label>
                ))}
              </div>
            </fieldset>
            {form.fields.includes('intensity') && (
              <fieldset>
                <legend className="text-sm font-medium text-slate-700">Unidades de intensidad permitidas</legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  {INTENSITY_UNITS.map((unit) => (
                    <label key={unit} className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.intensityUnits.includes(unit)}
                        onChange={(event) => toggleUnit(unit, event.target.checked)}
                      />
                      {unit}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <p className="text-xs text-slate-500">
              Estos campos son opcionales al registrar una intervención. No se guardan valores
              terapéuticos predeterminados.
            </p>
          </div>
        )}

        {canManage && (
          <label className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
            Disponible para nuevas intervenciones
          </label>
        )}
        {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
        {feedback && <p role="status" className="text-sm text-emerald-700">{feedback}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary min-h-11" disabled={saveItem.isPending}>
            {saveItem.isPending
              ? 'Guardando…'
              : canManage
                ? 'Guardar catálogo'
                : 'Agregar ejercicio'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn-ghost min-h-11"
              onClick={() => setForm({ ...EMPTY_FORM })}
            >
              Cancelar edición
            </button>
          )}
        </div>
        </form>
      )}

      <div className="list-panel">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold text-slate-800">Elementos del catálogo</h2>
            <p className="mt-0.5 text-xs text-slate-500">Busca ejercicios y agentes físicos disponibles.</p>
          </div>
          <input
            type="search"
            className="input min-h-10 sm:max-w-xs"
            placeholder="Buscar en el catálogo…"
            aria-label="Buscar en el catálogo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Cargando catálogo…</p>
        ) : isError ? (
          <p role="alert" className="p-5 text-sm text-red-700">
            No se pudo cargar el catálogo: {error.message}
          </p>
        ) : items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No hay elementos configurados.</p>
        ) : filteredItems.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No hay elementos que coincidan con la búsqueda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pagination.visibleItems.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {item.name} <span className="text-xs font-normal text-slate-500">· {item.kind === 'exercise' ? 'Ejercicio' : 'Agente físico'}</span>
                  </p>
                  {item.description && <p className="text-sm text-slate-600">{item.description}</p>}
                  <p className="text-xs text-slate-500">
                    {canManage && (item.active ? 'Disponible' : 'Inactivo')}
                    {item.kind === 'physical_agent' && item.parameterConfig.fields.length > 0
                      ? ` · Parámetros: ${item.parameterConfig.fields.map((field) => PARAMETER_LABELS[field]).join(', ')}`
                      : ''}
                  </p>
                </div>
                {canManage && (
                  <button type="button" className="btn-ghost min-h-10" onClick={() => editItem(item)}>
                    Editar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!isLoading && !isError && filteredItems.length > 0 && (
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={filteredItems.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        )}
      </div>
    </section>
  );
}

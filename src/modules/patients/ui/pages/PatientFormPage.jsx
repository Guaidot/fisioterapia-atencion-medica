import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, SelectField } from '../../../../shared/ui/components/Fields.jsx';
import {
  useCheckPatientCedula,
  useCreatePatient,
  useFindPatientByCedula,
  useRestorePatient,
  useUpdatePatient,
} from '../hooks/usePatients.js';
import { GENDERS } from '../../domain/entities/Patient.js';
import { z } from 'zod';

const PERSON_NAME_PATTERN = /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;
const PHONE_PATTERN = /^[+\d\s().-]*$/;

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const patientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(80, 'El nombre no puede superar 80 caracteres.')
    .regex(PERSON_NAME_PATTERN, 'Usa solo letras, espacios, guiones o apóstrofes.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio.')
    .max(80, 'El apellido no puede superar 80 caracteres.')
    .regex(PERSON_NAME_PATTERN, 'Usa solo letras, espacios, guiones o apóstrofes.'),
  cedula: z.string().regex(/^\d{6,10}$/, 'La cédula debe tener entre 6 y 10 dígitos.'),
  birthDate: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (isValidDate(value) && value <= localDateString(new Date())),
      'Ingresa una fecha válida que no sea futura.',
    ),
  gender: z.enum(GENDERS, { message: 'Seleccione un género.' }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value ||
        (PHONE_PATTERN.test(value) && (value.match(/\d/g) ?? []).length >= 7 &&
          (value.match(/\d/g) ?? []).length <= 15),
      'Ingresa un teléfono con 7 a 15 dígitos; puedes usar +, espacios, paréntesis o guiones.',
    ),
  occupation: z.string().trim().max(120, 'La ocupación no puede superar 120 caracteres.').optional(),
});

const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g, label: g }));

export function PatientFormPage({
  initial = {},
  isEditing = false,
  compact = false,
  onCancel,
  onSaved,
  onEditExisting,
  onAddHistory,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const createPatient = useCreatePatient();
  const checkPatientCedula = useCheckPatientCedula();
  const findPatientByCedula = useFindPatientByCedula();
  const updatePatient = useUpdatePatient();
  const restorePatient = useRestorePatient();
  const [duplicatePatient, setDuplicatePatient] = useState(null);
  const [duplicateError, setDuplicateError] = useState('');
  const [restoringDuplicate, setRestoringDuplicate] = useState(false);
  const [editingPatient, setEditingPatient] = useState(isEditing ? initial : null);
  const currentlyEditing = Boolean(editingPatient);
  const [form, setForm] = useState({
    firstName: initial.firstName ?? '',
    lastName: initial.lastName ?? '',
    cedula: initial.cedula ?? '',
    birthDate: initial.birthDate ?? '',
    gender: initial.gender ?? '',
    phone: initial.phone ?? '',
    occupation: initial.occupation ?? '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cedulaVerified, setCedulaVerified] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'cedula' && !currentlyEditing) {
      setCedulaVerified(false);
      setDuplicatePatient(null);
      setDuplicateError('');
      setErrors((current) => {
        const next = { ...current };
        delete next.cedula;
        delete next._root;
        return next;
      });
    }
  }

  async function verifyCedula() {
    const parsedCedula = patientSchema.shape.cedula.safeParse(form.cedula);
    if (!parsedCedula.success) {
      setErrors((current) => ({ ...current, cedula: parsedCedula.error.issues[0].message }));
      return false;
    }

    setLoading(true);
    try {
      const patient = await findPatientByCedula.mutateAsync(parsedCedula.data);
      if (patient) {
        setCedulaVerified(false);
        setDuplicatePatient(patient);
        setErrors((current) => {
          const next = { ...current };
          delete next.cedula;
          return next;
        });
        return false;
      }
      setDuplicatePatient(null);
      setErrors((current) => {
        const next = { ...current };
        delete next.cedula;
        return next;
      });
      setCedulaVerified(true);
      return true;
    } catch {
      setErrors((current) => ({
        ...current,
        cedula: 'No se pudo verificar la cédula. Intenta nuevamente.',
      }));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentlyEditing && !cedulaVerified) {
      await verifyCedula();
      return;
    }

    const parsed = patientSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (currentlyEditing) {
        await updatePatient.mutateAsync({
          id: editingPatient.id ?? initial.id ?? id,
          input: parsed.data,
        });
      } else {
        if (await checkPatientCedula.mutateAsync(parsed.data.cedula)) {
          setCedulaVerified(false);
          const foundPatient = await findPatientByCedula.mutateAsync(parsed.data.cedula);
          setDuplicatePatient(foundPatient);
          setErrors({});
          return;
        }
        await createPatient.mutateAsync(parsed.data);
      }
      if (onSaved) onSaved();
      else navigate('/pacientes');
    } catch (err) {
      setErrors({ _root: err.message || 'No se pudo guardar el paciente.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? '' : 'mx-auto max-w-2xl'}>
      {!compact && (
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">
          {currentlyEditing ? 'Editar paciente' : 'Nuevo paciente'}
        </h1>
      )}
      <form onSubmit={handleSubmit} className={compact ? 'space-y-4 p-5 sm:p-6' : 'card space-y-4'}>
        <TextField
          label="Cédula"
          value={form.cedula}
          onChange={(e) => set('cedula', e.target.value.replace(/\D/g, '').slice(0, 10))}
          error={errors.cedula}
          hint="Ingresa entre 6 y 10 dígitos."
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          required
        />

        {duplicatePatient && !currentlyEditing && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-amber-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="size-5"
                >
                  <path d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-amber-950">Este paciente ya está registrado</h3>
                <p className="mt-1 text-sm text-amber-900">
                  {duplicatePatient.fullName ||
                    `${duplicatePatient.firstName} ${duplicatePatient.lastName}`}
                  {' · Cédula '}
                  {duplicatePatient.cedula}
                </p>
                {duplicatePatient.archivedAt ? (
                  <>
                    <p className="mt-2 text-sm text-amber-900">
                      El registro está archivado. Restáuralo para editarlo o agregar una evaluación.
                    </p>
                    <button
                      type="button"
                      className="btn-primary mt-3 min-h-10"
                      disabled={restoringDuplicate}
                      onClick={async () => {
                        setDuplicateError('');
                        setRestoringDuplicate(true);
                        try {
                          await restorePatient.mutateAsync(duplicatePatient.id);
                          setDuplicatePatient({ ...duplicatePatient, archivedAt: null });
                        } catch (error) {
                          setDuplicateError(
                            error.message || 'No se pudo restaurar el paciente. Intenta nuevamente.',
                          );
                        } finally {
                          setRestoringDuplicate(false);
                        }
                      }}
                    >
                      {restoringDuplicate ? 'Restaurando…' : 'Restaurar paciente'}
                    </button>
                  </>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="btn-ghost min-h-10 justify-center border border-amber-300 bg-white"
                      onClick={() => {
                        if (onEditExisting) {
                          onEditExisting(duplicatePatient);
                          return;
                        }
                        setEditingPatient(duplicatePatient);
                        setForm({
                          firstName: duplicatePatient.firstName ?? '',
                          lastName: duplicatePatient.lastName ?? '',
                          cedula: duplicatePatient.cedula ?? '',
                          birthDate: duplicatePatient.birthDate ?? '',
                          gender: duplicatePatient.gender ?? '',
                          phone: duplicatePatient.phone ?? '',
                          occupation: duplicatePatient.occupation ?? '',
                        });
                        setDuplicatePatient(null);
                        setErrors({});
                      }}
                    >
                      Editar paciente
                    </button>
                    <button
                      type="button"
                      className="btn-primary min-h-10 justify-center"
                      onClick={() => {
                        if (onAddHistory) {
                          onAddHistory(duplicatePatient);
                        } else {
                          navigate(`/pacientes/${duplicatePatient.id}`);
                        }
                      }}
                    >
                      Agregar evaluación clínica
                    </button>
                  </div>
                )}
                {duplicateError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {duplicateError}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {(currentlyEditing || cedulaVerified) && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Nombre"
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <TextField
                label="Apellido"
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                error={errors.lastName}
                autoComplete="family-name"
              />
              <TextField
                label="Teléfono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={24}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                error={errors.phone}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Fecha de nacimiento"
                type="date"
                max={localDateString(new Date())}
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                error={errors.birthDate}
              />
              <SelectField
                label="Género"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                options={GENDER_OPTIONS}
                error={errors.gender}
              />
              <TextField
                label="Ocupación"
                maxLength={120}
                value={form.occupation}
                onChange={(e) => set('occupation', e.target.value)}
                error={errors.occupation}
              />
            </div>
          </>
        )}

        {errors._root && <p className="text-sm text-red-600">{errors._root}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => (onCancel ? onCancel() : navigate('/pacientes'))}
          >
            Cancelar
          </button>
          {duplicatePatient ? (
            <button
          type="button"
          className="btn-primary"
          onClick={() => {
            set('cedula', '');
            setErrors({});
          }}
            >
          Cambiar cédula
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? cedulaVerified || currentlyEditing
              ? 'Guardando…'
              : 'Verificando…'
            : currentlyEditing || cedulaVerified
              ? 'Guardar paciente'
              : 'Continuar'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
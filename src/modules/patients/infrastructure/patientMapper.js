import { Patient } from '../domain/entities/Patient.js';

export function rowToPatient(row) {
  return new Patient({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    cedula: row.cedula,
    birthDate: row.birth_date,
    gender: row.gender,
    phone: row.phone,
    occupation: row.occupation,
    therapistId: row.created_by,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  });
}

export function patientToRow(patient) {
  const p = patient.toPrimitives();
  return {
    id: p.id ?? undefined,
    first_name: p.firstName,
    last_name: p.lastName,
    cedula: p.cedula,
    birth_date: p.birthDate,
    gender: p.gender,
    phone: p.phone,
    occupation: p.occupation,
  };
}
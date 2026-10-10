import { User } from '../domain/entities/User.js';

export function rowToUser(row) {
  return new User({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  });
}

export function profileToUpdateRow({ fullName, role, isActive }) {
  const row = {};
  if (fullName !== undefined) row.full_name = fullName;
  if (role !== undefined) row.role = role;
  if (isActive !== undefined) row.is_active = isActive;
  row.updated_at = new Date().toISOString();
  return row;
}
import { describe, expect, it, vi } from 'vitest';
import { SupabaseAuthAdapter } from '../SupabaseAuthAdapter.js';

describe('SupabaseAuthAdapter.updatePassword', () => {
  it('updates the password through Supabase Auth', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const adapter = new SupabaseAuthAdapter({ auth: { updateUser } });

    await adapter.updatePassword('nueva-clave-123');

    expect(updateUser).toHaveBeenCalledWith({ password: 'nueva-clave-123' });
  });

  it('surfaces Supabase Auth errors', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: new Error('Invalid recovery token') });
    const adapter = new SupabaseAuthAdapter({ auth: { updateUser } });

    await expect(adapter.updatePassword('nueva-clave-123')).rejects.toThrow(
      'Invalid recovery token',
    );
  });
});

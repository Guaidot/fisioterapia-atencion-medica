import { UserRepository } from '../domain/ports/UserRepository.js';
import { getSupabaseClient } from '../../../shared/infra/supabase/client.js';
import { rowToUser, profileToUpdateRow } from './userMapper.js';

const TABLE = 'profiles';

export class SupabaseUserRepository extends UserRepository {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async findAll() {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToUser);
  }

  async findById(id) {
    const { data, error } = await this.client.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data) : null;
  }

  async findMyProfile() {
    const {
      data: { user },
      error: authError,
    } = await this.client.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data) : null;
  }

  async save(user) {
    if (user.isNew) {
      throw new Error('Los usuarios se crean mediante provisioning, no guardado directo.');
    }
    const row = profileToUpdateRow({
      fullName: user.fullName,
      role: user.role.value,
      isActive: user.isActive,
    });
    const { data, error } = await this.client
      .from(TABLE)
      .update(row)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return rowToUser(data);
  }

  async updateRole(id, role) {
    const { data, error } = await this.client
      .from(TABLE)
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToUser(data);
  }

  async deactivate(id) {
    const { error } = await this.client
      .from(TABLE)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
}
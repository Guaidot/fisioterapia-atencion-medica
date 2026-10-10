import { AuthPort } from '../../application/ports/AuthPort.js';
import { getSupabaseClient } from '../supabase/client.js';

export class SupabaseAuthAdapter extends AuthPort {
  constructor(client = getSupabaseClient()) {
    super();
    this.client = client;
  }

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error) return null;
    return data.user ?? null;
  }

  async updatePassword(password) {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw error;
  }

  onAuthStateChange(callback) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return data.subscription;
  }
}

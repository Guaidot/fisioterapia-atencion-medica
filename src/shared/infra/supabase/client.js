import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/**
 * Singleton del cliente Supabase.
 * Se expone mediante getSupabaseClient() para garantizar una única instancia
 * en toda la aplicación.
 */
class SupabaseClientSingleton {
  static #instance = null;

  constructor() {
    if (SupabaseClientSingleton.#instance) {
      return SupabaseClientSingleton.#instance;
    }

    if (!env.isSupabaseConfigured) {
      // No lanzamos error para permitir el arranque en modo placeholder;
      // los adaptadores informarán cuando se intente usar el backend.
      // eslint-disable-next-line no-console
      console.warn('[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
    }

    this.client = createClient(
      env.get('SUPABASE_URL') || 'http://localhost:54321',
      env.get('SUPABASE_ANON_KEY') || 'public-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );

    SupabaseClientSingleton.#instance = this;
  }

  static getInstance() {
    if (!SupabaseClientSingleton.#instance) {
      SupabaseClientSingleton.#instance = new SupabaseClientSingleton();
    }
    return SupabaseClientSingleton.#instance;
  }

  static reset() {
    SupabaseClientSingleton.#instance = null;
  }
}

export function getSupabaseClient() {
  return SupabaseClientSingleton.getInstance().client;
}

export { SupabaseClientSingleton };

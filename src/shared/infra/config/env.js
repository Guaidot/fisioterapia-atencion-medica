/**
 * Singleton de configuración / entorno.
 * Única fuente de verdad para variables de entorno.
 */
class EnvConfig {
  static #instance = null;

  #values;

  constructor() {
    if (EnvConfig.#instance) {
      return EnvConfig.#instance;
    }

    this.#values = Object.freeze({
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Fisioterapia',
      MODE: import.meta.env.MODE ?? 'development',
    });

    EnvConfig.#instance = this;
  }

  static getInstance() {
    if (!EnvConfig.#instance) {
      EnvConfig.#instance = new EnvConfig();
    }
    return EnvConfig.#instance;
  }

  get(key) {
    return this.#values[key];
  }

  get all() {
    return this.#values;
  }

  get isSupabaseConfigured() {
    return Boolean(this.#values.SUPABASE_URL && this.#values.SUPABASE_ANON_KEY);
  }
}

export const env = EnvConfig.getInstance();
export default EnvConfig;

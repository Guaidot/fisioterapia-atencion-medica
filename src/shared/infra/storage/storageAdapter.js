import { getSupabaseClient } from '../supabase/client.js';

/**
 * Adaptador genérico de Storage sobre Supabase.
 * Aísla a la aplicación de la implementación concreta de almacenamiento.
 */
export class SupabaseStorageAdapter {
  constructor(bucket) {
    this.bucket = bucket;
    this.client = getSupabaseClient();
  }

  async upload(path, file) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return this.getPublicUrl(data.path);
  }

  getPublicUrl(path) {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async remove(path) {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) throw error;
  }
}

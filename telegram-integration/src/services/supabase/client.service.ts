import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/env';

class SupabaseService {
  private client: SupabaseClient | null = null;

  getClient(): SupabaseClient {
    if (!this.client) {
      if (!config.supabase.url || !config.supabase.serviceRoleKey) {
        throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
      }
      this.client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    }
    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
  }
}

export default new SupabaseService();

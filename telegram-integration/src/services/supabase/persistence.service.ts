import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../../utils/logger';
import { config } from '../../config/env';
import {
  AgentEvents,
  DbSessionContext,
  ProductRow,
  AdvisorRow,
  UserDataUpdate,
} from '../../types/persistence.types';

class PersistenceService {
  private client: SupabaseClient | null = null;
  private productsCache: ProductRow[] = [];
  private advisorsCache: AdvisorRow[] = [];
  private advisorRoundRobin = 0;
  private initialized = false;

  isEnabled(): boolean {
    return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
  }

  isReady(): boolean {
    return this.initialized && this.client !== null;
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled()) {
      logger.warn(
        'Supabase persistence deshabilitada: configure SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
      );
      return;
    }

    this.client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await this.refreshCatalogs();
    this.initialized = true;
    logger.info('Supabase persistence inicializada', {
      products: this.productsCache.length,
      advisors: this.advisorsCache.length,
    });
  }

  getProductNames(): string[] {
    return this.productsCache.map((p) => p.name);
  }

  /**
   * Inicia sesión DB para un cliente del canal externo (Telegram/WhatsApp).
   */
  async startChannelSession(
    phone: string,
    channel: string,
    displayName?: string
  ): Promise<DbSessionContext | null> {
    if (!this.client) return null;

    const userId = await this.upsertUser(phone, displayName ? { name: displayName } : undefined);
    const conversationId = await this.getOrCreateConversation(userId, channel);

    return { dbUserId: userId, dbConversationId: conversationId, channel };
  }

  async insertMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    if (!this.client) return;

    const { error } = await this.client.from('messages').insert({
      conversation_id: conversationId,
      role,
      content,
    });

    if (error) {
      logger.error('Error insertando mensaje', { error: error.message });
    }
  }

  async processEvents(
    ctx: DbSessionContext,
    events: AgentEvents
  ): Promise<void> {
    if (!this.client) return;

    if (events.userData && Object.keys(events.userData).length > 0) {
      await this.updateUser(ctx.dbUserId, events.userData);
    }

    if (events.productInterest) {
      await this.upsertProductInterest(
        ctx.dbConversationId,
        events.productInterest.productName,
        events.productInterest.outcome ?? 'interested',
        events.productInterest.rejection_reason,
        events.productInterest.abandonment_step
      );
    }

    if (events.appointment) {
      await this.createAppointment(
        ctx,
        events.appointment.productName,
        events.appointment.scheduled_at,
        events.appointment.status ?? 'confirmed',
        events.appointment.summary
      );
    }

    if (events.closeConversation) {
      await this.closeConversation(ctx.dbConversationId, events.closeConversation);
    }
  }

  private async refreshCatalogs(): Promise<void> {
    if (!this.client) return;

    const [productsRes, advisorsRes] = await Promise.all([
      this.client.from('products').select('id,name,category,min_income,min_age,max_age').eq('active', true),
      this.client.from('advisors').select('id,name,active').eq('active', true),
    ]);

    if (productsRes.error) {
      logger.error('Error cargando productos', { error: productsRes.error.message });
    } else {
      this.productsCache = (productsRes.data ?? []) as ProductRow[];
    }

    if (advisorsRes.error) {
      logger.error('Error cargando asesores', { error: advisorsRes.error.message });
    } else {
      this.advisorsCache = (advisorsRes.data ?? []) as AdvisorRow[];
    }
  }

  private async upsertUser(
    phone: string,
    partial?: { name?: string; status?: string }
  ): Promise<string> {
    const { data: existing } = await this.client!
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing?.id) {
      if (partial && Object.keys(partial).length > 0) {
        await this.client!.from('users').update(partial).eq('id', existing.id);
      }
      return existing.id;
    }

    const { data, error } = await this.client!
      .from('users')
      .insert({ phone, ...partial })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear usuario: ${error?.message}`);
    }

    return data.id;
  }

  private async updateUser(userId: string, data: UserDataUpdate): Promise<void> {
    const payload: Partial<UserDataUpdate> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.email !== undefined) payload.email = data.email;
    if (data.monthly_income !== undefined) payload.monthly_income = data.monthly_income;
    if (data.id_number !== undefined) payload.id_number = data.id_number;
    if (data.status !== undefined) payload.status = data.status;

    if (Object.keys(payload).length === 0) return;

    const { error } = await this.client!.from('users').update(payload).eq('id', userId);
    if (error) {
      logger.error('Error actualizando usuario', { error: error.message });
    }
  }

  private async getOrCreateConversation(userId: string, channel: string): Promise<string> {
    const { data: active } = await this.client!
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('channel', channel)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (active?.id) return active.id;

    const { data, error } = await this.client!
      .from('conversations')
      .insert({ user_id: userId, channel, status: 'active' })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear conversación: ${error?.message}`);
    }

    return data.id;
  }

  private findProductByName(name: string): ProductRow | undefined {
    const normalized = name.toLowerCase().trim();
    return this.productsCache.find(
      (p) =>
        p.name.toLowerCase() === normalized ||
        p.name.toLowerCase().includes(normalized) ||
        normalized.includes(p.name.toLowerCase())
    );
  }

  private async upsertProductInterest(
    conversationId: string,
    productName: string,
    outcome: string,
    rejectionReason?: string,
    abandonmentStep?: string
  ): Promise<void> {
    if (this.productsCache.length === 0) await this.refreshCatalogs();

    const product = this.findProductByName(productName);
    if (!product) {
      logger.warn('Producto no encontrado en catálogo', { productName });
      return;
    }

    const payload: Record<string, unknown> = {
      conversation_id: conversationId,
      product_id: product.id,
      outcome,
    };
    if (rejectionReason) payload.rejection_reason = rejectionReason;
    if (abandonmentStep) payload.abandonment_step = abandonmentStep;

    const { error } = await this.client!
      .from('product_interests')
      .upsert(payload, { onConflict: 'conversation_id,product_id' });

    if (error) {
      logger.error('Error upsert product_interest', { error: error.message });
    }
  }

  private pickAdvisor(): AdvisorRow | undefined {
    if (this.advisorsCache.length === 0) return undefined;
    const advisor = this.advisorsCache[this.advisorRoundRobin % this.advisorsCache.length];
    this.advisorRoundRobin += 1;
    return advisor;
  }

  private async createAppointment(
    ctx: DbSessionContext,
    productName: string,
    scheduledAt: string,
    status: string,
    summary?: string
  ): Promise<void> {
    if (this.productsCache.length === 0 || this.advisorsCache.length === 0) {
      await this.refreshCatalogs();
    }

    const product = this.findProductByName(productName);
    const advisor = this.pickAdvisor();

    if (!product || !advisor) {
      logger.warn('No se pudo crear cita: producto o asesor no disponible', { productName });
      return;
    }

    const scheduled = new Date(scheduledAt);
    const validDate = Number.isNaN(scheduled.getTime())
      ? new Date(Date.now() + 86400000)
      : scheduled;

    const { error } = await this.client!.from('appointments').insert({
      user_id: ctx.dbUserId,
      product_id: product.id,
      advisor_id: advisor.id,
      conversation_id: ctx.dbConversationId,
      status,
      summary: summary ?? null,
      scheduled_at: validDate.toISOString(),
    });

    if (error) {
      logger.error('Error creando cita', { error: error.message });
      return;
    }

    await this.client!
      .from('users')
      .update({ status: 'qualified' })
      .eq('id', ctx.dbUserId);

    await this.closeConversation(ctx.dbConversationId, 'completed');
  }

  private async closeConversation(
    conversationId: string,
    status: 'completed' | 'abandoned'
  ): Promise<void> {
    const { error } = await this.client!
      .from('conversations')
      .update({ status, ended_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      logger.error('Error cerrando conversación', { error: error.message });
    }
  }
}

export default new PersistenceService();

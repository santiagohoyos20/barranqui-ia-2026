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
  private initPromise: Promise<void> | null = null;
  private ready = false;

  isEnabled(): boolean {
    return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
  }

  isReady(): boolean {
    return this.ready && this.client !== null;
  }

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    if (!this.isEnabled()) {
      logger.warn('[DB] Persistencia deshabilitada — configure SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY', {
        hasUrl: Boolean(config.supabase.url),
        hasKey: Boolean(config.supabase.serviceRoleKey),
      });
      return;
    }

    logger.info('[DB] Inicializando cliente Supabase', { url: config.supabase.url });

    this.client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await this.refreshCatalogs();
    this.ready = true;
    logger.info('[DB] Persistencia inicializada correctamente', {
      products: this.productsCache.length,
      advisors: this.advisorsCache.length,
    });
  }

  private async ensureReady(): Promise<boolean> {
    await this.initialize();
    if (!this.client) {
      logger.error('[DB] Cliente Supabase no disponible tras initialize()');
      return false;
    }
    return true;
  }

  getProductNames(): string[] {
    return this.productsCache.map((p) => p.name);
  }

  async startChannelSession(
    phone: string,
    channel: string,
    displayName?: string
  ): Promise<DbSessionContext | null> {
    if (!(await this.ensureReady())) return null;

    logger.info('[DB] Iniciando sesión de canal', { phone, channel, displayName });

    try {
      const userId = await this.upsertUser(phone, displayName ? { name: displayName } : undefined);
      const conversationId = await this.getOrCreateConversation(userId, channel);

      const ctx: DbSessionContext = { dbUserId: userId, dbConversationId: conversationId, channel };
      logger.info('[DB] Sesión de canal creada', ctx);
      return ctx;
    } catch (error) {
      logger.error('[DB] Error iniciando sesión de canal', {
        phone,
        channel,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  async insertMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<boolean> {
    if (!(await this.ensureReady())) return false;

    const { data, error } = await this.client!.from('messages').insert({
      conversation_id: conversationId,
      role,
      content,
    }).select('id').single();

    if (error) {
      logger.error('[DB] Error insertando mensaje', {
        conversationId,
        role,
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return false;
    }

    logger.info('[DB] Mensaje guardado', { conversationId, role, messageId: data?.id });
    return true;
  }

  async processEvents(ctx: DbSessionContext, events: AgentEvents): Promise<void> {
    if (!(await this.ensureReady())) return;

    logger.info('[DB] Procesando eventos', { ctx, events: JSON.stringify(events) });

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
      logger.error('[DB] Error cargando productos', {
        error: productsRes.error.message,
        code: productsRes.error.code,
        hint: productsRes.error.hint,
      });
    } else {
      this.productsCache = (productsRes.data ?? []) as ProductRow[];
      logger.info('[DB] Catálogo de productos cargado', { count: this.productsCache.length });
    }

    if (advisorsRes.error) {
      logger.error('[DB] Error cargando asesores', {
        error: advisorsRes.error.message,
        code: advisorsRes.error.code,
      });
    } else {
      this.advisorsCache = (advisorsRes.data ?? []) as AdvisorRow[];
      logger.info('[DB] Asesores cargados', { count: this.advisorsCache.length });
    }
  }

  private async upsertUser(
    phone: string,
    partial?: { name?: string; status?: string }
  ): Promise<string> {
    const { data: existing, error: selectError } = await this.client!
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Error buscando usuario: ${selectError.message}`);
    }

    if (existing?.id) {
      if (partial && Object.keys(partial).length > 0) {
        const { error: updateError } = await this.client!.from('users').update(partial).eq('id', existing.id);
        if (updateError) {
          logger.warn('[DB] Error actualizando usuario existente', { userId: existing.id, error: updateError.message });
        } else {
          logger.info('[DB] Usuario existente actualizado', { userId: existing.id, phone, partial });
        }
      }
      logger.info('[DB] Usuario existente reutilizado', { userId: existing.id, phone });
      return existing.id;
    }

    const { data, error } = await this.client!
      .from('users')
      .insert({ phone, ...partial })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear usuario: ${error?.message} (${error?.code})`);
    }

    logger.info('[DB] Usuario creado', { userId: data.id, phone });
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
      logger.error('[DB] Error actualizando datos de usuario', { userId, payload, error: error.message });
    } else {
      logger.info('[DB] Datos de usuario actualizados', { userId, fields: Object.keys(payload) });
    }
  }

  private async getOrCreateConversation(userId: string, channel: string): Promise<string> {
    const { data: active, error: selectError } = await this.client!
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('channel', channel)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Error buscando conversación: ${selectError.message}`);
    }

    if (active?.id) {
      logger.info('[DB] Conversación activa reutilizada', { conversationId: active.id, userId, channel });
      return active.id;
    }

    const { data, error } = await this.client!
      .from('conversations')
      .insert({ user_id: userId, channel, status: 'active' })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear conversación: ${error?.message} (${error?.code})`);
    }

    logger.info('[DB] Conversación creada', { conversationId: data.id, userId, channel });
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
      logger.warn('[DB] Producto no encontrado en catálogo', {
        productName,
        available: this.productsCache.map((p) => p.name),
      });
      return;
    }

    const payload: Record<string, unknown> = {
      conversation_id: conversationId,
      product_id: product.id,
      outcome,
    };
    if (rejectionReason) payload.rejection_reason = rejectionReason;
    if (abandonmentStep) payload.abandonment_step = abandonmentStep;

    const { data, error } = await this.client!
      .from('product_interests')
      .upsert(payload, { onConflict: 'conversation_id,product_id' })
      .select('id')
      .single();

    if (error) {
      logger.error('[DB] Error upsert product_interest', {
        payload,
        error: error.message,
        code: error.code,
        details: error.details,
      });
    } else {
      logger.info('[DB] product_interest guardado', {
        id: data?.id,
        productName: product.name,
        outcome,
      });
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
      logger.warn('[DB] No se pudo crear cita: producto o asesor no disponible', { productName });
      return;
    }

    const scheduled = new Date(scheduledAt);
    const validDate = Number.isNaN(scheduled.getTime())
      ? new Date(Date.now() + 86400000)
      : scheduled;

    const { data, error } = await this.client!.from('appointments').insert({
      user_id: ctx.dbUserId,
      product_id: product.id,
      advisor_id: advisor.id,
      conversation_id: ctx.dbConversationId,
      status,
      summary: summary ?? null,
      scheduled_at: validDate.toISOString(),
    }).select('id').single();

    if (error) {
      logger.error('[DB] Error creando cita', { error: error.message, code: error.code });
      return;
    }

    logger.info('[DB] Cita creada', { appointmentId: data?.id, productName: product.name, advisor: advisor.name });

    await this.client!.from('users').update({ status: 'qualified' }).eq('id', ctx.dbUserId);
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
      logger.error('[DB] Error cerrando conversación', { conversationId, error: error.message });
    } else {
      logger.info('[DB] Conversación cerrada', { conversationId, status });
    }
  }
}

export default new PersistenceService();

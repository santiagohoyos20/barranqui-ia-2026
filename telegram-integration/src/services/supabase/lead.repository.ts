import supabaseService from './client.service';
import { ExtractedIntelligence } from '../../types/intelligence.types';

class LeadRepository {
  async closeConversation(conversationId: string): Promise<void> {
    if (!supabaseService.isConfigured()) return;
    try {
      const { error } = await supabaseService.getClient()
        .from('conversations')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (error) throw error;
      console.log(`[Supabase] ✅ Conversación marcada como completada (id: ${conversationId})`);
    } catch (error) {
      console.log(`[Supabase] ❌ Error cerrando conversación:`, error);
    }
  }

  private async resolveProductId(productName: string): Promise<string | null> {
    try {
      const { data } = await supabaseService.getClient()
        .from('products')
        .select('id')
        .eq('name', productName)
        .single();
      return data?.id ?? null;
    } catch {
      return null;
    }
  }

  async upsertUser(
    telegramUserId: string,
    username: string | undefined,
    data: ExtractedIntelligence
  ): Promise<string | null> {
    if (!supabaseService.isConfigured()) {
      console.log(`[Supabase] ❌ NO guardado — variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas`);
      return null;
    }

    try {
      const client = supabaseService.getClient();
      const payload: Record<string, any> = {
        telegram_user_id: telegramUserId,
        telegram_username: username ?? null,
        updated_at: new Date().toISOString(),
      };
      if (data.userData.name)  payload.name  = data.userData.name;
      if (data.userData.phone) payload.phone = data.userData.phone;
      if (data.userData.email) payload.email = data.userData.email;

      const { data: existing } = await client
        .from('users')
        .select('id')
        .eq('telegram_user_id', telegramUserId)
        .single();

      let userId: string | null = null;

      if (existing) {
        const { error } = await client.from('users').update(payload).eq('telegram_user_id', telegramUserId);
        if (error) throw error;
        userId = existing.id;
        console.log(`[Supabase] ✅ Usuario actualizado (id: ${userId})`);
      } else {
        const { data: inserted, error } = await client
          .from('users')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        userId = inserted?.id ?? null;
        console.log(`[Supabase] ✅ Usuario creado (id: ${userId})`);
      }

      return userId;
    } catch (error) {
      console.log(`[Supabase] ❌ Error guardando usuario:`, error);
      return null;
    }
  }

  async getOrCreateConversation(userId: string): Promise<string | null> {
    if (!supabaseService.isConfigured()) return null;

    try {
      const client = supabaseService.getClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await client
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('started_at', todayStart.toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        console.log(`[Supabase] ✅ Conversación existente reutilizada (id: ${existing.id})`);
        return existing.id;
      }

      const { data: created, error } = await client
        .from('conversations')
        .insert({ user_id: userId, channel: 'telegram', status: 'active' })
        .select('id')
        .single();

      if (error) throw error;
      console.log(`[Supabase] ✅ Conversación nueva creada (id: ${created?.id})`);
      return created?.id ?? null;
    } catch (error) {
      console.log(`[Supabase] ❌ Error en conversación:`, error);
      return null;
    }
  }

  async saveMessages(
    conversationId: string,
    userMessage: string,
    agentResponse: string
  ): Promise<void> {
    if (!supabaseService.isConfigured()) return;

    try {
      const { error } = await supabaseService.getClient().from('messages').insert([
        { conversation_id: conversationId, role: 'user',      content: userMessage },
        { conversation_id: conversationId, role: 'assistant', content: agentResponse },
      ]);
      if (error) throw error;
      console.log(`[Supabase] ✅ Mensajes guardados (conversación: ${conversationId})`);
    } catch (error) {
      console.log(`[Supabase] ❌ Error guardando mensajes:`, error);
    }
  }

  async saveProductInterests(
    conversationId: string,
    data: ExtractedIntelligence
  ): Promise<void> {
    if (!supabaseService.isConfigured()) return;
    if (!data.productInterests.length) {
      console.log(`[Supabase] ⚪ Sin productos detectados — no se guarda en product_interests`);
      return;
    }

    try {
      const outcome =
        data.intentType === 'solicitud_cita' ? 'qualified' :
        data.rejectionReason                 ? 'rejected'  :
        data.abandonmentStep                 ? 'abandoned' :
        'interested';

      const rows = await Promise.all(
        data.productInterests.map(async (productName) => {
          const productId = await this.resolveProductId(productName);
          return {
            conversation_id:  conversationId,
            product_id:       productId,
            product_name:     productId ? null : productName,
            outcome,
            rejection_reason: data.rejectionReason ?? null,
            abandonment_step: data.abandonmentStep ?? null,
          };
        })
      );

      const { error } = await supabaseService.getClient().from('product_interests').insert(rows);
      if (error) throw error;
      console.log(`[Supabase] ✅ Intereses guardados: ${data.productInterests.join(', ')} (outcome: ${outcome})`);
    } catch (error) {
      console.log(`[Supabase] ❌ Error guardando product_interests:`, error);
    }
  }

  async saveAppointmentRequest(
    userId: string,
    conversationId: string,
    data: ExtractedIntelligence
  ): Promise<void> {
    if (!supabaseService.isConfigured()) return;
    if (!data.appointmentRequest.detected) {
      console.log(`[Supabase] ⚪ Sin solicitud de cita detectada`);
      return;
    }

    try {
      const mainProduct = data.productInterests[0];
      const productId = mainProduct ? await this.resolveProductId(mainProduct) : null;

      const { error } = await supabaseService.getClient().from('appointments').insert({
        user_id:         userId,
        conversation_id: conversationId,
        product_id:      productId,
        product_name:    productId ? null : (mainProduct ?? null),
        status:          'pending_confirmation',
        summary:         data.summary,
        preferred_time:  data.appointmentRequest.preferredTime ?? null,
      });

      if (error) throw error;
      console.log(`[Supabase] ✅ Solicitud de cita guardada (usuario: ${userId})`);
    } catch (error) {
      console.log(`[Supabase] ❌ Error guardando cita:`, error);
    }
  }
}

export default new LeadRepository();
